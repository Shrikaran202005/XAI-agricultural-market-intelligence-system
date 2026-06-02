import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import BackendStatus from '../components/BackendStatus';
import SHAPVisualization from '../components/XAI/SHAPVisualization';
import FeatureImportanceChart from '../components/XAI/FeatureImportanceChart';
import SHAPSummaryChart from '../components/XAI/SHAPSummaryChart';
import StockListingForm from '../components/StockListingForm';
import MyListings from '../components/MyListings';
import IncomingOrders from '../components/IncomingOrders';

const FarmerDashboard = memo(() => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prediction'); // 'prediction' or 'marketplace'
  const [marketplaceRefresh, setMarketplaceRefresh] = useState(0);
  const [formData, setFormData] = useState({
    crop: 'rice',
    quantity: '1000',
    state: 'Tamil Nadu',
    investment: '50000',
    transport_cost: '5000',
    storage_cost: '2000',
    harvest_date: ''
  });

  const crops = ['rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'pulses'];
  const states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Maharashtra', 
                 'Gujarat', 'Rajasthan', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh'];

  useEffect(() => {
    // Check if user is authenticated and has farmer role
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile && userProfile.role !== 'farmer') {
      navigate('/middleman-dashboard');
      return;
    }

    // Set default harvest date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      harvest_date: tomorrow.toISOString().split('T')[0]
    }));
  }, [currentUser, userProfile, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const data = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        investment: parseFloat(formData.investment),
        transport_cost: parseFloat(formData.transport_cost),
        storage_cost: parseFloat(formData.storage_cost),
        location: formData.state, // Map state to location for backend API
        prediction_date: formData.harvest_date, // Map harvest_date to prediction_date for backend API
        userId: currentUser.uid
      };

      const result = await apiService.predictFarmer(data);
      setResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
  }, [logout, navigate]);

  if (!currentUser || (userProfile && userProfile.role !== 'farmer')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold">Farmer Dashboard</h1>
              <p className="text-green-100">Welcome, {userProfile?.name || 'Farmer'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-100">{userProfile?.location}</span>
              <BackendStatus />
              <button
                onClick={handleLogout}
                className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('prediction')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'prediction'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Price Prediction
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'marketplace'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🌾 Marketplace
            </button>
          </div>
        </div>

        {/* Prediction Tab */}
        {activeTab === 'prediction' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Prediction</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crop
                    </label>
                    <select
                      name="crop"
                      value={formData.crop}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {crops.map(crop => (
                        <option key={crop} value={crop}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (quintals)
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harvest Date
                    </label>
                    <input
                      type="date"
                      name="harvest_date"
                      value={formData.harvest_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investment (Rs)
                    </label>
                    <input
                      type="number"
                      name="investment"
                      value={formData.investment}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transport Cost (Rs)
                    </label>
                    <input
                      type="number"
                      name="transport_cost"
                      value={formData.transport_cost}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Cost (Rs)
                    </label>
                    <input
                      type="number"
                      name="storage_cost"
                      value={formData.storage_cost}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Predicting...' : 'Get Prediction'}
                  </button>
                </form>
              </div>
            </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Analyzing market data and generating predictions...</p>
              </div>
            )}

            {results && (
              <div className="space-y-6">
                {/* Prediction Results */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Prediction Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Predicted Price</p>
                      <p className="text-2xl font-bold text-green-600">₹{results.prediction?.predicted_price || 0}/quintal</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Expected Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">₹{results.profit_analysis?.revenue || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Expected Profit</p>
                      <p className="text-2xl font-bold text-purple-600">₹{results.profit_analysis?.profit_amount || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Confidence Score</p>
                      <p className="text-xl font-bold text-yellow-600">{Math.round((results.prediction?.confidence || 0) * 100)}%</p>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment:</span>
                      <span className="font-medium">₹{formData.investment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transport Cost:</span>
                      <span className="font-medium">₹{formData.transport_cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage Cost:</span>
                      <span className="font-medium">₹{formData.storage_cost}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Total Cost:</span>
                      <span className="font-bold text-red-600">₹{parseFloat(formData.investment) + parseFloat(formData.transport_cost) + parseFloat(formData.storage_cost)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Explanation */}
                {results.explanation && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Explanation</h3>
                    <p className="text-gray-700">{results.explanation}</p>
                  </div>
                )}

                {/* SHAP Visualizations */}
                {results.shap_data && (
                  <>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">SHAP Feature Importance</h3>
                      <SHAPVisualization 
                        shapData={results.shap_data} 
                        featureImportance={results.top_features}
                        explanation={results.explanation}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <FeatureImportanceChart featureImportance={results.top_features} />
                      <SHAPSummaryChart shapData={results.shap_data} />
                    </div>
                  </>
                )}

                {/* Market Comparison */}
                {results.market_comparison && results.market_comparison.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Comparison</h3>
                    <div className="space-y-2">
                      {results.market_comparison.map((market, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-gray-700">{market.state}</span>
                          <span className="font-medium">₹{market.price}/quintal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!results && !loading && !error && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  Enter your crop details to get AI-powered price predictions and market insights
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <StockListingForm onListingCreated={() => setMarketplaceRefresh(prev => prev + 1)} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <MyListings refreshTrigger={marketplaceRefresh} />
              <IncomingOrders refreshTrigger={marketplaceRefresh} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

FarmerDashboard.displayName = 'FarmerDashboard';

export default FarmerDashboard;
