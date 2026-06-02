import requests
import json

# Test the API endpoints
base_url = "http://localhost:5000"

def test_health():
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_prediction():
    try:
        test_data = {
            "crop": "rice",
            "quantity": 1000,
            "location": "Tamil Nadu",
            "prediction_date": "2025-05-15",
            "investment": 50000,
            "transport_cost": 5000,
            "storage_cost": 2000
        }
        
        response = requests.post(f"{base_url}/api/predict/farmer", json=test_data)
        print(f"Prediction test: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"Prediction test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing API endpoints...")
    
    if test_health():
        print("Health check passed")
        test_prediction()
    else:
        print("Health check failed - server might not be running")
