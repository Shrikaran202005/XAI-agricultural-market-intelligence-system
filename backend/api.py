from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import numpy as np
import pickle
import pandas as pd
import json

# Import our services
from agmarknet_service import AgmarknetService
from shap_service import XAIService
from firestore_service import marketplace_service

# Custom JSON encoder for numpy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Helper function to convert numpy types
def convert_numpy(obj):
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

# Initialize services
agmarknet_service = AgmarknetService()
xai_service = None

# Load the FIXED high-accuracy model
try:
    print("Loading fixed high-accuracy model...")
    
    # Load model components
    with open('fixed_model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('fixed_scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    with open('fixed_encoders.pkl', 'rb') as f:
        label_encoders = pickle.load(f)
    with open('fixed_features.pkl', 'rb') as f:
        feature_data = pickle.load(f)
        feature_columns = feature_data['feature_columns']
        top_crops = feature_data['top_crops']
    
    print(f"✅ Model loaded successfully!")
    print(f"   Features: {len(feature_columns)}")
    print(f"   Top crops: {len(top_crops)}")
    
    # Initialize XAI/SHAP service
    xai_service = XAIService(model, scaler, label_encoders, feature_columns)
    xai_service.initialize_explainer(agmarknet_service.sample_data)
    print("✅ XAI/SHAP service initialized")
    
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("Please run: python train_and_evaluate.py")
    model = None
    xai_service = None

# Helper function for fixed model predictions with comprehensive fixes
def predict_with_fixed_model(crop, state, date, district=None, market=None, min_price=None, max_price=None):
    """
    Make prediction using the fixed high-accuracy model with:
    - Input validation and normalization
    - Real price integration from dataset
    - Safe category encoding for unknown values
    - Exact feature matching with training
    - Debug logging
    - Comprehensive error handling
    """
    try:
        # 1. INPUT VALIDATION
        print(f"[PREDICTION] Input: crop={crop}, state={state}, date={date}")
        
        if model is None:
            raise ValueError("Model not loaded. Please train the model first.")
        
        # Normalize and validate inputs
        crop = str(crop).strip().title()
        state = str(state).strip().title()
        
        # Validate crop is in top crops
        if crop not in top_crops:
            print(f"[WARNING] Crop '{crop}' not in top crops. Using closest match or default.")
            # Try to find closest match
            crop_lower = crop.lower()
            for top_crop in top_crops:
                if crop_lower in top_crop.lower() or top_crop.lower() in crop_lower:
                    crop = top_crop
                    print(f"[INFO] Using matched crop: {crop}")
                    break
            else:
                crop = top_crops[0]  # Fallback to first crop
                print(f"[WARNING] Using fallback crop: {crop}")
        
        # Validate date
        try:
            date_obj = pd.to_datetime(date)
            print(f"[INFO] Valid date: {date_obj}")
        except Exception as e:
            print(f"[ERROR] Invalid date format: {date}")
            raise ValueError(f"Invalid date format: {date}")
        
        # 2. REAL PRICE INTEGRATION
        # Fetch real min_price and max_price from dataset if not provided
        if min_price is None or max_price is None:
            try:
                latest_price_info = agmarknet_service.get_latest_prices(crop, state)
                if latest_price_info:
                    if min_price is None:
                        min_price = latest_price_info.get('min_price', latest_price_info.get('price', 1000) * 0.8)
                    if max_price is None:
                        max_price = latest_price_info.get('max_price', latest_price_info.get('price', 3000) * 1.2)
                    print(f"[INFO] Fetched real prices: min={min_price}, max={max_price}")
                else:
                    # Fallback to reasonable defaults
                    min_price = min_price or 1000
                    max_price = max_price or 3000
                    print(f"[WARNING] Using default prices: min={min_price}, max={max_price}")
            except Exception as price_error:
                print(f"[ERROR] Failed to fetch real prices: {price_error}")
                min_price = min_price or 1000
                max_price = max_price or 3000
        
        # Clamp price range to reasonable values
        min_price = max(100, min(min_price, 5000))
        max_price = max(min_price, min(max_price, 10000))
        
        # Fetch real district and market from dataset if not provided
        if district is None or market is None:
            try:
                # Get sample data for this crop and state
                sample_data = agmarknet_service.data[
                    (agmarknet_service.data['commodity'] == crop) & 
                    (agmarknet_service.data['state'] == state)
                ]
                if not sample_data.empty:
                    if district is None:
                        district = sample_data['district'].iloc[0]
                    if market is None:
                        market = sample_data['market'].iloc[0]
                    print(f"[INFO] Fetched real district: {district}, market: {market}")
                else:
                    # Fallback to placeholder values
                    if district is None:
                        district = f"{state}_district"
                    if market is None:
                        market = f"{state}_market"
                    print(f"[WARNING] Using placeholder district: {district}, market: {market}")
            except Exception as loc_error:
                print(f"[ERROR] Failed to fetch location data: {loc_error}")
                if district is None:
                    district = f"{state}_district"
                if market is None:
                    market = f"{state}_market"
        
        # 3. CREATE INPUT DATAFRAME
        input_df = pd.DataFrame([{
            'commodity': crop,
            'state': state,
            'district': district,
            'market': market,
            'arrival_date': date_obj,
            'min_price': min_price,
            'max_price': max_price
        }])
        
        # 4. FEATURE ENGINEERING (EXACT MATCH WITH TRAINING)
        input_df['year'] = input_df['arrival_date'].dt.year
        input_df['month'] = input_df['arrival_date'].dt.month
        input_df['quarter'] = input_df['arrival_date'].dt.quarter
        input_df['month_sin'] = np.sin(2 * np.pi * input_df['month'] / 12)
        input_df['month_cos'] = np.cos(2 * np.pi * input_df['month'] / 12)
        input_df['price_range'] = input_df['max_price'] - input_df['min_price']
        
        # Avoid division by zero in volatility calculation
        avg_price = (input_df['min_price'] + input_df['max_price']) / 2
        input_df['price_volatility'] = np.where(avg_price > 0, input_df['price_range'] / avg_price, 0)
        
        # 5. SAFE CATEGORY ENCODING
        unknown_categories = {}
        for col in ['state', 'district', 'market', 'commodity']:
            if col in label_encoders:
                input_df[col] = input_df[col].astype(str)
                known = set(label_encoders[col].classes_)
                
                # Handle unknown categories safely
                unknown_mask = ~input_df[col].isin(known)
                if unknown_mask.any():
                    unknown_values = input_df.loc[unknown_mask, col].unique()
                    unknown_categories[col] = list(unknown_values)
                    print(f"[WARNING] Unknown categories for {col}: {unknown_values}")
                    # Replace with most frequent class (first class)
                    input_df.loc[unknown_mask, col] = label_encoders[col].classes_[0]
                
                input_df[f'{col}_encoded'] = label_encoders[col].transform(input_df[col])
        
        # 6. ENSURE EXACT FEATURE MATCH
        # Fill missing features with 0
        for col in feature_columns:
            if col not in input_df.columns:
                input_df[col] = 0
                print(f"[INFO] Added missing feature: {col} = 0")
        
        # Ensure exact feature order
        X = input_df[feature_columns].copy()
        print(f"[INFO] Feature columns: {feature_columns}")
        print(f"[INFO] X shape: {X.shape}")
        
        # 7. PREDICTION PIPELINE
        X_scaled = scaler.transform(X)
        print(f"[INFO] X_scaled shape: {X_scaled.shape}")
        
        # Predict (log scale)
        pred_log = model.predict(X_scaled)[0]
        print(f"[INFO] Predicted log price: {pred_log}")
        
        # Reverse log transform
        price = np.expm1(pred_log)
        print(f"[INFO] Predicted price (before clamp): {price}")
        
        # Clamp output range (₹500 – ₹20000)
        price = max(500, min(20000, price))
        price = round(price, 2)
        
        print(f"[SUCCESS] Final predicted price: ₹{price}")
        
        # Return detailed prediction result
        return {
            'predicted_price': price,
            'confidence': 0.85,
            'unknown_categories': unknown_categories,
            'input_validation': {
                'crop_used': crop,
                'state_used': state,
                'min_price_used': min_price,
                'max_price_used': max_price
            }
        }
        
    except Exception as e:
        print(f"[ERROR] Prediction failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

@app.route('/')
def home():
    return jsonify({
        'message': 'Agricultural Market Intelligence System API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': [
            '/api/health',
            '/api/prices',
            '/api/predict/farmer',
            '/api/predict/middleman',
            '/api/market-overview/<crop>',
            '/api/marketplace/listings',
            '/api/marketplace/create-listing',
            '/api/marketplace/listings',
            '/api/orders/create',
            '/api/orders/list',
            '/api/orders/update-status'
        ]
    })

@app.route('/api/health')
def health_check():
    response = {
        'status': 'healthy',
        'services': {
            'agmarknet': agmarknet_service is not None,
            'xai': xai_service is not None
        },
        'model_loaded': model is not None,
        'top_crops': list(top_crops) if 'top_crops' in globals() else []
    }
    return jsonify(convert_numpy(response))

@app.route('/api/prices')
def get_prices():
    """Get historical price data"""
    try:
        crop = request.args.get('crop')
        state = request.args.get('state')
        days = int(request.args.get('days', 30))
        
        # Get price data
        price_data = agmarknet_service.get_price_data(crop=crop, state=state)
        
        if price_data.empty:
            return jsonify({'error': 'No price data available for specified criteria'}), 404
        
        # Filter for requested days
        cutoff_date = datetime.now() - timedelta(days=days)
        price_data = price_data[price_data['date'] >= cutoff_date]
        
        return jsonify({
            'crop': crop,
            'state': state,
            'data': price_data.to_dict('records'),
            'count': len(price_data)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/farmer', methods=['POST'])
def predict_farmer():
    """
    Generate price prediction and recommendations for farmers with:
    - Comprehensive error handling
    - Proper response structure
    - XAI integration with fallback
    - Debug logging
    """
    try:
        print(f"[API] predict_farmer called")
        data = request.get_json()
        print(f"[API] Request data: {data}")
        
        # Validate required fields
        required_fields = ['crop', 'quantity', 'location', 'prediction_date']
        for field in required_fields:
            if field not in data:
                print(f"[ERROR] Missing required field: {field}")
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Extract parameters
        crop = data['crop']
        quantity = float(data['quantity'])
        location = data['location']
        prediction_date = data['prediction_date']
        
        print(f"[API] Extracted params: crop={crop}, quantity={quantity}, location={location}, date={prediction_date}")
        
        # Get prediction using fixed high-accuracy model
        try:
            prediction_result = predict_with_fixed_model(crop, location, prediction_date)
            
            if prediction_result is None:
                print(f"[ERROR] Prediction returned None")
                return jsonify({
                    'success': False,
                    'error': 'Prediction failed - no result returned'
                }), 500
            
            predicted_price = prediction_result.get('predicted_price')
            if predicted_price is None or np.isnan(predicted_price):
                print(f"[ERROR] Invalid predicted price: {predicted_price}")
                return jsonify({
                    'success': False,
                    'error': 'Prediction failed - invalid price result'
                }), 500
            
            print(f"[SUCCESS] Predicted price: ₹{predicted_price}")
            
        except Exception as pred_error:
            print(f"[ERROR] Prediction model error: {pred_error}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': f'Prediction model error: {str(pred_error)}'
            }), 500
        
        # Generate XAI explanation with fallback
        explanation_data = None
        explanation_text = ""
        try:
            if xai_service:
                explanation_data = xai_service.explain_prediction(crop, location, prediction_date, quantity)
                if explanation_data:
                    explanation_text = "AI-powered price explanation based on SHAP feature importance analysis."
                    print(f"[SUCCESS] XAI explanation generated with SHAP values")
                else:
                    explanation_text = "XAI service returned no data. Price prediction based on historical market data."
                    print(f"[WARNING] XAI service returned None")
            else:
                explanation_text = "XAI service not available. Price prediction based on historical market data."
                print(f"[WARNING] XAI service not available")
        except Exception as xai_error:
            print(f"[ERROR] XAI service error: {xai_error}")
            explanation_text = "Explanation temporarily unavailable. Price prediction based on historical market data and current trends."
        
        # Get market comparison
        market_comparison = []
        try:
            states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Maharashtra']
            for comp_state in states:
                if comp_state != location:
                    try:
                        latest_price = agmarknet_service.get_latest_prices(crop, comp_state)
                        if latest_price:
                            market_comparison.append({
                                'state': comp_state,
                                'price': float(latest_price['price']),
                                'date': latest_price['date']
                            })
                    except Exception as comp_error:
                        print(f"[WARNING] Error getting price for {comp_state}: {comp_error}")
                        continue
            print(f"[INFO] Market comparison: {len(market_comparison)} states")
        except Exception as market_error:
            print(f"[ERROR] Market comparison error: {market_error}")
            market_comparison = []
        
        # Calculate profit analysis
        try:
            predicted_price = float(predicted_price)
            revenue = predicted_price * quantity
            profit_margin = 10.0  # Default 10% profit margin
            profit_amount = revenue * (profit_margin / 100)
            
            print(f"[INFO] Revenue: ₹{revenue}, Profit: ₹{profit_amount}")
        except Exception as profit_error:
            print(f"[ERROR] Profit calculation error: {profit_error}")
            revenue = 0
            profit_margin = 0
            profit_amount = 0
        
        # Get price trend
        price_trend = []
        try:
            price_trend = agmarknet_service.get_price_trend(crop=crop, state=location, days=30)
            print(f"[INFO] Price trend: {len(price_trend)} data points")
        except Exception as trend_error:
            print(f"[ERROR] Price trend error: {trend_error}")
            price_trend = []
        
        # Build response structure with full SHAP data
        response = {
            'success': True,
            'prediction': {
                'predicted_price': predicted_price,
                'confidence': prediction_result.get('confidence', 0.85)
            },
            'explanation': explanation_text,
            'shap_data': explanation_data if explanation_data else None,
            'top_features': explanation_data.get('top_features', []) if explanation_data else [],
            'profit_analysis': {
                'revenue': revenue,
                'profit_margin': profit_margin,
                'profit_amount': profit_amount
            },
            'market_comparison': market_comparison,
            'price_trend': price_trend,
            'input_validation': prediction_result.get('input_validation', {}),
            'warnings': {
                'unknown_categories': prediction_result.get('unknown_categories', {})
            }
        }
        
        print(f"[SUCCESS] Response prepared successfully")
        return jsonify(convert_numpy(response))
        
    except Exception as e:
        print(f"[ERROR] Error in farmer prediction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/predict/middleman', methods=['POST'])
def predict_middleman():
    """Generate demand analysis and procurement recommendations for middlemen"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['crop', 'demand_quantity', 'target_price', 'location', 'urgency']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Extract parameters
        crop = data['crop']
        demand_quantity = float(data['demand_quantity'])
        target_price = float(data['target_price'])
        location = data['location']
        urgency = data['urgency']
        
        # Get current market data
        latest_price_info = agmarknet_service.get_latest_prices(crop, location)
        
        if not latest_price_info:
            current_price = target_price
        else:
            current_price = latest_price_info['price']
        
        # Get price trend
        price_trend = agmarknet_service.get_price_trend(crop=crop, state=location, days=30)
        
        # Analyze market conditions
        price_gap = current_price - target_price
        price_gap_percent = (price_gap / target_price) * 100
        
        # Generate demand trend
        demand_trend = []
        base_demand = demand_quantity
        
        # Handle price_trend data structure
        if isinstance(price_trend, dict) and 'datasets' in price_trend and len(price_trend['datasets']) > 0:
            price_data = price_trend['datasets'][0]['data']
            dates = price_trend['labels']
        else:
            # Fallback if data structure is different or empty
            price_data = [current_price] * 30
            dates = [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(30)]
        
        for i, price in enumerate(price_data):
            # Inverse relationship between price and demand
            price_factor = 2000 / price if price > 0 else 1
            seasonal_factor = 1 + 0.2 * np.sin(2 * np.pi * i / 30)
            
            calculated_demand = base_demand * price_factor * seasonal_factor
            calculated_demand = max(50, min(5000, calculated_demand))
            
            demand_trend.append({
                'date': dates[i] if i < len(dates) else (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'),
                'demand': round(calculated_demand, 0),
                'supply': round(price * 10, 0)
            })
        
        # Generate recommendation
        recommendation = _generate_procurement_recommendation(
            price_gap_percent, urgency, current_price, target_price
        )
        
        # Find potential suppliers (mock data)
        suppliers = _find_potential_suppliers(crop, location, demand_quantity, current_price)
        
        # Get demand-supply indicators (with fallback if method doesn't exist)
        try:
            demand_supply = agmarknet_service.get_demand_supply_indicators(crop, location)
        except AttributeError:
            # Fallback to default indicators
            demand_supply = {
                'demand_level': 'medium',
                'supply_level': 'medium',
                'price_trend': 'stable',
                'market_sentiment': 'neutral'
            }
        
        # Prepare response
        response = {
            'success': True,
            'current_price': current_price,
            'target_price': target_price,
            'demand_level': demand_supply['demand_level'],
            'supply_level': demand_supply['supply_level'],
            'price_trend': demand_supply['price_trend'],
            'recommendation': recommendation['action'],
            'reasoning': recommendation['reasoning'],
            'confidence': recommendation['confidence'],
            'available_supply': demand_supply['avg_quantity'] if 'avg_quantity' in demand_supply else 1000,
            'demand_trend': demand_trend,
            'suppliers': suppliers[:5],  # Top 5 suppliers
            'price_gap_percent': price_gap_percent
        }
        
        return jsonify(convert_numpy(response))
        
    except Exception as e:
        print(f"Error in middleman prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/market-overview/<crop>')
def get_market_overview(crop):
    """Get comprehensive market overview for a crop"""
    try:
        state_comparison = agmarknet_service.get_state_comparison(crop)
        
        # Calculate national average
        if state_comparison:
            national_average = sum(state['avg_price'] for state in state_comparison.values()) / len(state_comparison)
        else:
            national_average = 0
        
        return jsonify({
            'crop': crop,
            'state_comparison': state_comparison,
            'national_average': national_average,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error getting market overview: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/listings', methods=['GET'])
def get_listings():
    """Get all crop listings with optional filters"""
    try:
        # Get query parameters for filtering
        crop_filter = request.args.get('crop')
        location_filter = request.args.get('location')
        status_filter = request.args.get('status', 'available')
        
        # Get listings using marketplace service
        result = marketplace_service.get_listings(crop_filter, location_filter, status_filter)
        
        if result['success']:
            listings = result['listings']
            # Apply price filters if provided
            min_price = request.args.get('min_price', type=float)
            max_price = request.args.get('max_price', type=float)
            if min_price:
                listings = [l for l in listings if l['expected_price'] >= min_price]
            if max_price:
                listings = [l for l in listings if l['expected_price'] <= max_price]
            
            return jsonify({
                'success': True,
                'listings': listings,
                'count': len(listings)
            })
        else:
            return jsonify({'error': result.get('error', 'Failed to get listings'), 'listings': []}), 500
        
    except Exception as e:
        print(f"[ERROR] Failed to get listings: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/listings/create', methods=['POST'])
def create_listing():
    """Create a new crop listing"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['crop', 'quantity', 'expected_price', 'ready_date', 'location', 'farmerId']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Create listing using marketplace service
        listing_data = {
            'crop': data['crop'],
            'quantity': float(data['quantity']),
            'expected_price': float(data['expected_price']),
            'ready_date': data['ready_date'],
            'location': data['location'],
            'farmerId': data['farmerId'],
            'status': data.get('status', 'available')
        }

        result = marketplace_service.create_listing(listing_data)

        if result['success']:
            return jsonify({
                'success': True,
                'listing': result['listing'],
                'message': 'Listing created successfully'
            })
        else:
            return jsonify({'error': result.get('error', 'Failed to create listing')}), 500

    except Exception as e:
        print(f"[ERROR] Failed to create listing: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/listings/my', methods=['GET'])
def get_my_listings():
    """Get listings for a specific farmer"""
    try:
        farmer_id = request.args.get('farmerId')
        
        if not farmer_id:
            return jsonify({'error': 'farmerId is required'}), 400
        
        # Get listings using marketplace service
        result = marketplace_service.get_my_listings(farmer_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'listings': result['listings'],
                'farmerId': farmer_id
            })
        else:
            return jsonify({'error': result.get('error', 'Failed to get listings'), 'listings': []}), 500
        
    except Exception as e:
        print(f"[ERROR] Failed to get my listings: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/create', methods=['POST'])
def create_order():
    """Create an order when middleman accepts a listing or proposes a price"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['listingId', 'farmerId', 'middlemanId', 'agreedPrice', 'quantity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Determine if this is an accept deal or propose price
        action = data.get('action', 'accept')  # 'accept' or 'propose'
        status = 'accepted' if action == 'accept' else 'pending'
        
        # Create order using marketplace service
        order_data = {
            'listingId': data['listingId'],
            'farmerId': data['farmerId'],
            'middlemanId': data['middlemanId'],
            'agreed_price': float(data['agreedPrice']),
            'quantity': float(data['quantity']),
            'status': status
        }
        
        result = marketplace_service.create_order(order_data)
        
        if result['success']:
            # Update listing status based on action
            if action == 'accept':
                marketplace_service.update_listing_status(data['listingId'], 'sold')
            else:
                marketplace_service.update_listing_status(data['listingId'], 'negotiation')
            
            return jsonify({
                'success': True,
                'order': result['order'],
                'message': f'Order created successfully ({action})'
            })
        else:
            return jsonify({'error': result.get('error', 'Failed to create order')}), 500
        
    except Exception as e:
        print(f"[ERROR] Failed to create order: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/list', methods=['GET'])
def list_orders():
    """Get orders for a user (farmer or middleman)"""
    try:
        user_type = request.args.get('userType')  # 'farmer' or 'middleman'
        user_id = request.args.get('userId')
        
        if not user_type or not user_id:
            return jsonify({'error': 'userType and userId are required'}), 400
        
        # Get orders using marketplace service
        result = marketplace_service.get_orders(user_id, user_type)
        
        if result['success']:
            return jsonify({
                'success': True,
                'orders': result['orders'],
                'userType': user_type
            })
        else:
            return jsonify({'error': result.get('error', 'Failed to get orders'), 'orders': []}), 500
        
    except Exception as e:
        print(f"[ERROR] Failed to get orders: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/update-status', methods=['PUT'])
def update_order_status():
    """Update order status"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['orderId', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        valid_statuses = ['pending', 'accepted', 'rejected', 'delivered']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status: {data["status"]}'}), 400
        
        # Update order status using marketplace service
        result = marketplace_service.update_order_status(data['orderId'], data['status'])
        
        if result['success']:
            return jsonify({
                'success': True,
                'orderId': data['orderId'],
                'status': data['status'],
                'message': f'Order status updated to {data["status"]}'
            })
        else:
            return jsonify({'error': result.get('error', 'Failed to update order status')}), 500
        
    except Exception as e:
        print(f"[ERROR] Failed to update order status: {e}")
        return jsonify({'error': str(e)}), 500

def _generate_procurement_recommendation(price_gap_percent, urgency, current_price, target_price):
    """Generate procurement recommendation"""
    if urgency == 'high':
        if abs(price_gap_percent) < 10:
            return {
                'action': 'procure_immediately',
                'reasoning': 'Price gap is minimal, urgent procurement recommended',
                'confidence': 0.9
            }
        else:
            return {
                'action': 'negotiate_bulk_discount',
                'reasoning': 'Significant price gap allows for bulk negotiation',
                'confidence': 0.8
            }
    elif urgency == 'medium':
        if abs(price_gap_percent) < 15:
            return {
                'action': 'wait_for_better_price',
                'reasoning': 'Moderate price gap, wait for market improvement',
                'confidence': 0.7
            }
        else:
            return {
                'action': 'procure_gradually',
                'reasoning': 'Significant price variation, gradual procurement reduces risk',
                'confidence': 0.75
            }
    else:  # low urgency
        return {
            'action': 'market_research',
            'reasoning': 'Low urgency allows for thorough market research',
            'confidence': 0.6
        }

def _find_potential_suppliers(crop, location, demand_quantity, current_price):
    """Find potential suppliers (mock implementation)"""
    # Mock supplier data
    suppliers = [
        {
            'name': f'{crop} Wholesale Market {location}',
            'location': location,
            'capacity': demand_quantity * 1.5,
            'price_per_quintal': current_price * 0.95,  # 5% discount
            'reliability': 'high',
            'delivery_time': '2-3 days'
        },
        {
            'name': f'Regional {crop} Traders',
            'location': location,
            'capacity': demand_quantity * 1.2,
            'price_per_quintal': current_price * 0.98,  # 2% discount
            'reliability': 'medium',
            'delivery_time': '3-5 days'
        },
        {
            'name': f'Farm Direct {location}',
            'location': location,
            'capacity': demand_quantity * 0.8,
            'price_per_quintal': current_price * 0.9,  # 10% discount
            'reliability': 'variable',
            'delivery_time': '1-2 days'
        }
    ]
    
    # Sort by price and reliability
    suppliers.sort(key=lambda x: (x['price_per_quintal'], x['reliability']))
    
    return suppliers

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
