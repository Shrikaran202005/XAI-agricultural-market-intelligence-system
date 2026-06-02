# 🌾 Agricultural Market Intelligence System

An AI-powered full-stack platform that helps farmers and agricultural traders make data-driven decisions through crop price prediction, market analysis, profitability estimation, and Explainable AI (XAI).

---

## 🚀 Overview

The Agricultural Market Intelligence System leverages Machine Learning, Explainable AI, and market data analytics to provide actionable insights for both farmers and middlemen.

The system predicts future crop prices, recommends the most profitable markets, estimates profits after expenses, and explains the reasoning behind AI predictions using SHAP-based interpretability techniques.

---

## 🎯 Key Features

### 👨‍🌾 Farmer Module

* Crop Price Prediction using Machine Learning
* Best Market Recommendation across states
* Optimal Selling Date Prediction
* Profit Estimation with transportation and storage costs
* Explainable AI (XAI) insights for every prediction
* Interactive price trend visualizations

### 🏢 Middleman Module

* Demand vs Supply Analysis
* Procurement Recommendations
* Supplier Identification Support
* Market Trend Analysis
* Buy Now or Wait Decision Assistance

---

## 🧠 AI & Machine Learning Capabilities

### Price Prediction Engine

* Random Forest Regression Model
* Historical Agricultural Market Data Analysis
* Seasonal Trend Detection
* Demand-Based Price Forecasting

### Explainable AI (XAI)

* SHAP (SHapley Additive Explanations)
* Feature Importance Analysis
* Prediction Confidence Scores
* Human-Readable Explanations

---

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Recharts
* Axios

### Backend

* Flask
* Scikit-Learn
* SHAP
* Pandas
* NumPy

### Data Source

* Agmarknet Agricultural Market Data
* Historical Crop Price Records

---
## 📊 Dataset

This project uses agricultural market price data obtained from the Government of India's Open Data Platform and Agmarknet market records.

### Dataset Source

Users can download agricultural market datasets from:

* [Data.gov.in Agricultural Datasets](https://data.gov.in/catalogs/agriculture?utm_source=chatgpt.com)
* [AGMARKNET Portal](https://agmarknet.gov.in/?utm_source=chatgpt.com)

### Dataset Placement

After downloading the dataset, place it in the project root directory:

```text
XAI-agricultural-market-intelligence-system/
│
├── data.gov.in-1.csv
├── backend/
├── frontend/
└── README.md
```

### Expected Dataset Columns

The model expects agricultural market records containing fields similar to:

```text
State
District
Market
Commodity
Variety
Arrival_Date
Min_Price
Max_Price
Modal_Price
```

## 📂 Project Structure

```text
XAI-agricultural-market-intelligence-system/

├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── farmer_routes.py
│   │   └── middleman_routes.py
│   ├── services/
│   │   ├── agmarknet_service.py
│   │   ├── pricing_service.py
│   │   ├── cost_service.py
│   │   └── xai_service.py
│   └── models/
│       └── price_model.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   └── components/
│
└── README.md
```

---

## ⚙️ Installation

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

python app.py
```

Backend Server:

```text
http://localhost:5000
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend Server:

```text
http://localhost:5173
```

---

## 🔌 API Endpoints

### Health Check

```http
GET /api/health
```

---

### Historical Price Data

```http
GET /api/prices?crop=<crop>&state=<state>
```

---

### Farmer Prediction

```http
POST /api/predict/farmer
```

#### Sample Request

```json
{
  "crop": "rice",
  "quantity": 100,
  "state": "Tamil Nadu",
  "investment": 20000,
  "transport_cost": 5000,
  "storage_cost": 3000,
  "harvest_date": "2026-06-15"
}
```

#### Sample Response

```json
{
  "predicted_price": 2500,
  "best_state": "Karnataka",
  "best_date": "2026-06-15",
  "profit": 15000,
  "explanation": {
    "summary": "Price is expected to rise due to high demand.",
    "confidence": 85
  }
}
```

---

### Middleman Analysis

```http
POST /api/predict/middleman
```

#### Sample Request

```json
{
  "crop": "rice",
  "demand_quantity": 500,
  "target_price": 2400,
  "location": "Tamil Nadu",
  "urgency": "medium"
}
```

---

## 📊 System Workflow

1. User enters crop and market details.
2. Historical agricultural data is processed.
3. Machine Learning model predicts future prices.
4. Profit and cost calculations are performed.
5. SHAP generates explainable AI insights.
6. Results are displayed through interactive dashboards.

---

## 📈 Future Enhancements

* Real-time Agmarknet API Integration
* Weather-Based Price Forecasting
* Mobile Application Support
* Multi-Language Interface
* Crop Disease Risk Prediction
* Deep Learning-Based Forecast Models
* Real-Time Market Alerts

---

## 🎓 Applications

* Smart Agriculture
* Precision Farming
* Agricultural Research
* Government Market Analysis
* Agri-Tech Startups
* Farmer Decision Support Systems

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Shrikaran P**

AI/ML Enthusiast | Full Stack Developer | Agricultural Intelligence Researcher

Focused on building intelligent systems that combine Artificial Intelligence, Explainable AI, Data Analytics, and Agriculture to solve real-world problems.
