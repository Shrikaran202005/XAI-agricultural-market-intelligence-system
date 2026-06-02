import shap
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

class XAIService:
    """XAI/SHAP explanation service for the fixed model"""
    
    def __init__(self, model, scaler, label_encoders, feature_columns):
        self.model = model
        self.scaler = scaler
        self.label_encoders = label_encoders
        self.feature_columns = feature_columns
        self.explainer = None
        self.background_data = None
        
    def initialize_explainer(self, background_records):
        """Initialize SHAP explainer with background data"""
        # Prepare background data from records
        X_background = self._prepare_features_from_records(background_records)
        self.background_data = X_background
        
        # Create SHAP TreeExplainer
        self.explainer = shap.TreeExplainer(self.model, X_background)
        print("✅ XAI/SHAP explainer initialized")
        
    def _prepare_features_from_records(self, records):
        """Convert sample records to feature matrix"""
        features_list = []
        
        for record in records[:100]:  # Use first 100 records
            try:
                # Create feature row
                row = {
                    'year': datetime.now().year,
                    'month': datetime.now().month,
                    'quarter': (datetime.now().month - 1) // 3 + 1,
                    'month_sin': np.sin(2 * np.pi * datetime.now().month / 12),
                    'month_cos': np.cos(2 * np.pi * datetime.now().month / 12),
                    'min_price': record.get('min_price', 1000),
                    'max_price': record.get('max_price', 3000),
                    'price_range': record.get('max_price', 3000) - record.get('min_price', 1000),
                    'price_volatility': 0.5
                }
                
                # Encode categorical
                for col in ['state', 'district', 'market', 'commodity']:
                    val = record.get(col, 'Unknown')
                    if col in self.label_encoders:
                        if val in self.label_encoders[col].classes_:
                            row[f'{col}_encoded'] = self.label_encoders[col].transform([val])[0]
                        else:
                            row[f'{col}_encoded'] = 0
                    else:
                        row[f'{col}_encoded'] = 0
                
                features_list.append([row.get(col, 0) for col in self.feature_columns])
            except:
                continue
        
        if len(features_list) == 0:
            # Return zeros if no valid records
            return np.zeros((10, len(self.feature_columns)))
        
        X = np.array(features_list)
        return self.scaler.transform(X)
    
    def explain_prediction(self, crop, state, date, quantity=100, min_price=1000, max_price=3000):
        """Generate SHAP explanation for a prediction"""
        try:
            if self.explainer is None:
                print("[WARNING] SHAP explainer not initialized")
                return None
            
            # Prepare input features
            input_df = pd.DataFrame([{
                'commodity': crop,
                'state': state,
                'district': f"{state}_district",
                'market': f"{state}_market",
                'arrival_date': pd.to_datetime(date),
                'min_price': min_price,
                'max_price': max_price
            }])
            
            # Engineer features
            input_df['year'] = input_df['arrival_date'].dt.year
            input_df['month'] = input_df['arrival_date'].dt.month
            input_df['quarter'] = input_df['arrival_date'].dt.quarter
            input_df['month_sin'] = np.sin(2 * np.pi * input_df['month'] / 12)
            input_df['month_cos'] = np.cos(2 * np.pi * input_df['month'] / 12)
            input_df['price_range'] = input_df['max_price'] - input_df['min_price']
            avg_price = (input_df['min_price'] + input_df['max_price']) / 2
            input_df['price_volatility'] = np.where(avg_price > 0, input_df['price_range'] / avg_price, 0)
            
            # Encode categorical
            for col in ['state', 'district', 'market', 'commodity']:
                if col in self.label_encoders:
                    input_df[col] = input_df[col].astype(str)
                    known = set(self.label_encoders[col].classes_)
                    input_df.loc[~input_df[col].isin(known), col] = self.label_encoders[col].classes_[0]
                    input_df[f'{col}_encoded'] = self.label_encoders[col].transform(input_df[col])
            
            # Fill missing
            for col in self.feature_columns:
                if col not in input_df.columns:
                    input_df[col] = 0
            
            # Scale
            X = input_df[self.feature_columns]
            X_scaled = self.scaler.transform(X)
            
            print(f"[SHAP] X_scaled shape: {X_scaled.shape}")
            
            # Get SHAP values
            shap_values = self.explainer.shap_values(X_scaled)
            
            print(f"[SHAP] shap_values type: {type(shap_values)}")
            print(f"[SHAP] shap_values shape: {shap_values[0].shape if isinstance(shap_values, list) else shap_values.shape}")
            
            # Get base value
            base_value = self.explainer.expected_value
            if isinstance(base_value, list):
                base_value = base_value[0]
            base_value = float(base_value)
            
            print(f"[SHAP] base_value: {base_value}")
            
            # Format explanation - convert shap_values to list for JSON serialization
            # Handle both list and numpy array cases, and extract first sample if 2D
            if isinstance(shap_values, list):
                shap_values_array = np.array(shap_values)
                if len(shap_values_array.shape) == 2 and shap_values_array.shape[0] == 1:
                    shap_values_list = shap_values_array[0].tolist()
                else:
                    shap_values_list = shap_values_array.tolist()
            else:
                # numpy array
                if len(shap_values.shape) == 2 and shap_values.shape[0] == 1:
                    shap_values_list = shap_values[0].tolist()
                else:
                    shap_values_list = shap_values.tolist()
            
            print(f"[SHAP] shap_values_list length: {len(shap_values_list)}")
            
            # Also create feature importance for easier consumption
            feature_importance = []
            for i, col in enumerate(self.feature_columns):
                importance = float(shap_values_list[i])
                feature_importance.append({
                    'feature': col,
                    'importance': round(importance, 4),
                    'value': round(X[col].iloc[0], 2)
                })
            
            # Sort by absolute importance
            feature_importance.sort(key=lambda x: abs(x['importance']), reverse=True)
            
            prediction = float(self.model.predict(X_scaled)[0])
            
            print(f"[SHAP] Prediction: {prediction}")
            print(f"[SUCCESS] SHAP explanation generated")
            
            return {
                'shap_values': shap_values_list,
                'feature_names': self.feature_columns,
                'base_value': base_value,
                'prediction': prediction,
                'top_features': feature_importance[:10]
            }
            
        except Exception as e:
            print(f"[ERROR] SHAP explanation failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_feature_importance(self):
        """Get global feature importance from model"""
        if hasattr(self.model, 'feature_importances_'):
            importance = []
            for i, col in enumerate(self.feature_columns):
                importance.append({
                    'feature': col,
                    'importance': round(float(self.model.feature_importances_[i]), 4)
                })
            importance.sort(key=lambda x: x['importance'], reverse=True)
            return importance
        return []
