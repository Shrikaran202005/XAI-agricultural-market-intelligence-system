import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import BackendStatus from '../components/BackendStatus';
import BrowseListings from '../components/BrowseListings';
import MyOrders from '../components/MyOrders';

const MiddlemanDashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prediction'); // 'prediction' or 'marketplace'
  const [marketplaceRefresh, setMarketplaceRefresh] = useState(0);
  const [formData, setFormData] = useState({
    crop: 'rice',
    demand_quantity: '2000',
    target_price: '2000',
    location: 'Tamil Nadu',
    urgency: 'medium'
  });

  const crops = ['rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'pulses'];
  const states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Maharashtra', 
                 'Gujarat', 'Rajasthan', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh'];

  useEffect(() => {
    // Check if user is authenticated and has middleman role
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile && userProfile.role !== 'middleman') {
      navigate('/farmer-dashboard');
      return;
    }
  }, [currentUser, userProfile, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const data = {
        ...formData,
        demand_quantity: parseFloat(formData.demand_quantity),
        target_price: parseFloat(formData.target_price),
        userId: currentUser.uid
      };

      const result = await apiService.predictMiddleman(data);
      setResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
  };

  if (!currentUser || (userProfile && userProfile.role !== 'middleman')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold">Middleman Dashboard</h1>
              <p className="text-blue-100">Welcome, {userProfile?.name || 'Middleman'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-100">{userProfile?.location}</span>
              <BackendStatus />
              <button
                onClick={handleLogout}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Demand Analysis
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'marketplace'
                  ? 'text-blue-600 border-b-2 border-blue-600'
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Demand Analysis</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crop
                  </label>
                  <select
                    name="crop"
                    value={formData.crop}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {crops.map(crop => (
                      <option key={crop} value={crop}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Demand Quantity (quintals)
                  </label>
                  <input
                    type="number"
                    name="demand_quantity"
                    value={formData.demand_quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Price (Rs/quintal)
                  </label>
                  <input
                    type="number"
                    name="target_price"
                    value={formData.target_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urgency
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Analyze Demand'}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Analyzing market demand and supply conditions...</p>
              </div>
            )}

            {results && (
              <div className="space-y-6">
                {/* Analysis Results */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Demand Analysis Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Current Price</p>
                      <p className="text-2xl font-bold text-blue-600">Rs {results.current_price}/quintal</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Target Price</p>
                      <p className="text-2xl font-bold text-green-600">Rs {results.target_price}/quintal</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Demand Level</p>
                      <p className="text-xl font-bold text-purple-600 capitalize">{results.demand_level}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Supply Level</p>
                      <p className="text-xl font-bold text-yellow-600 capitalize">{results.supply_level}</p>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Recommendation</h3>
                  <div className={`p-4 rounded-lg ${
                    results.recommendation === 'buy now' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        results.recommendation === 'buy now' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <p className={`text-lg font-semibold ${
                        results.recommendation === 'buy now' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {results.recommendation === 'buy now' ? 'BUY NOW' : 'WAIT'}
                      </p>
                    </div>
                    <p className="text-gray-700 mt-2">{results.reasoning}</p>
                    <p className="text-sm text-gray-500 mt-1">Confidence: {results.confidence}%</p>
                  </div>
                </div>

                {/* Market Indicators */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Indicators</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price Trend:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        results.price_trend === 'rising' 
                          ? 'bg-green-100 text-green-800'
                          : results.price_trend === 'falling'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {results.price_trend}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Available Supply:</span>
                      <span className="font-medium">{results.available_supply} quintals</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price Gap:</span>
                      <span className={`font-medium ${
                        results.price_gap_percent > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {results.price_gap_percent > 0 ? '+' : ''}{results.price_gap_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Potential Suppliers */}
                {results.suppliers && results.suppliers.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Potential Suppliers</h3>
                    <div className="space-y-3">
                      {results.suppliers && results.suppliers.slice(0, 5).map((supplier, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{supplier.name}</p>
                              <p className="text-sm text-gray-600">{supplier.location}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-blue-600">Rs {(supplier.price_per_quintal || supplier.expected_price || 0).toFixed(0)}/q</p>
                              <p className="text-sm text-gray-600">{supplier.capacity || supplier.quantity_available || 0} q available</p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500">Reliability: {supplier.reliability || 'N/A'}</span>
                            <span className="text-gray-500">Delivery: {supplier.delivery_time || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Demand Trend Chart */}
                {results.demand_trend && results.demand_trend.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Demand Trend Analysis</h3>
                    <div className="space-y-2">
                      {results.demand_trend.slice(0, 10).map((trend, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{trend.date}</span>
                          <div className="flex space-x-4">
                            <span className="text-sm font-medium text-blue-600">Demand: {trend.demand} q</span>
                            <span className="text-sm font-medium text-green-600">Supply: {trend.supply} q</span>
                          </div>
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
                  Enter your demand requirements to get AI-powered market analysis and procurement recommendations
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <BrowseListings onOrderCreated={() => setMarketplaceRefresh(prev => prev + 1)} />
            <MyOrders refreshTrigger={marketplaceRefresh} />
          </div>
        )}
      </main>
    </div>
  );
};

export default MiddlemanDashboard;
