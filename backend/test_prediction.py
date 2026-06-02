"""
Test script to verify the prediction model works
"""
import pickle
import pandas as pd
import numpy as np

print("=" * 60)
print("TESTING PREDICTION MODEL")
print("=" * 60)

# Load model components
try:
    print("\n[1] Loading model files...")
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
    
    print("✅ Model loaded successfully!")
    print(f"   Model type: {type(model).__name__}")
    print(f"   Features: {len(feature_columns)}")
    print(f"   Top crops: {len(top_crops)}")
    print(f"   Top crops list: {top_crops[:5]}")
    
except Exception as e:
    print(f"❌ Error loading model: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Test prediction
try:
    print("\n[2] Testing prediction...")
    print(f"   Test crop: {top_crops[0]}")
    print(f"   Test state: Tamil Nadu")
    print(f"   Test date: 2025-05-01")
    
    # Create test input
    crop = top_crops[0]
    state = "Tamil Nadu"
    date = "2025-05-01"
    district = f"{state}_district"
    market = f"{state}_market"
    min_price = 1000
    max_price = 3000
    
    # Create input dataframe
    input_df = pd.DataFrame([{
        'commodity': crop,
        'state': state,
        'district': district,
        'market': market,
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
        if col in label_encoders:
            input_df[col] = input_df[col].astype(str)
            known = set(label_encoders[col].classes_)
            unknown_mask = ~input_df[col].isin(known)
            if unknown_mask.any():
                print(f"   WARNING: Unknown categories for {col}: {input_df.loc[unknown_mask, col].unique()}")
                input_df.loc[unknown_mask, col] = label_encoders[col].classes_[0]
            input_df[f'{col}_encoded'] = label_encoders[col].transform(input_df[col])
    
    # Fill missing features
    for col in feature_columns:
        if col not in input_df.columns:
            input_df[col] = 0
    
    # Prepare features
    X = input_df[feature_columns]
    X_scaled = scaler.transform(X)
    
    print(f"   Input shape: {X.shape}")
    print(f"   Scaled shape: {X_scaled.shape}")
    
    # Predict
    pred_log = model.predict(X_scaled)[0]
    price = np.expm1(pred_log)
    price = max(500, min(20000, price))
    price = round(price, 2)
    
    print(f"✅ Prediction successful!")
    print(f"   Predicted price: ₹{price}")
    print(f"   Log prediction: {pred_log}")
    
except Exception as e:
    print(f"❌ Prediction error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("\n" + "=" * 60)
print("MODEL IS WORKING CORRECTLY!")
print("=" * 60)
