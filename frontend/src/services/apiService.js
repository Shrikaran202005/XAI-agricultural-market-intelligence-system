import axios from 'axios';

// Base URL for the Flask API
const API_BASE_URL = 'http://localhost:5000';

// Simple cache implementation
const cache = new Map();

// Cache helper functions
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add any custom headers
apiClient.interceptors.request.use(
  (config) => {
    // Add any custom headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle common error cases
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your internet connection.');
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
      
      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          throw new Error('Unauthorized: Please login again.');
        case 403:
          throw new Error('Forbidden: You do not have permission to perform this action.');
        case 404:
          throw new Error('Not Found: The requested resource was not found.');
        case 500:
          throw new Error(`Server Error: ${message}`);
        default:
          throw new Error(`Error ${status}: ${message}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Unable to connect to the server. Please check if the backend is running.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
);

// API Service Functions
export const apiService = {
  // Health check
  async healthCheck() {
    const cacheKey = 'health_check';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/health');
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  },

  // Get historical price data
  async getPrices(params = {}) {
    const cacheKey = `prices_${JSON.stringify(params)}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/prices', { params });
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  },

  // Farmer price prediction
  async predictFarmer(formData) {
    const response = await apiClient.post('/api/predict/farmer', formData);
    return response.data;
  },

  // Middleman demand analysis
  async predictMiddleman(formData) {
    const response = await apiClient.post('/api/predict/middleman', formData);
    return response.data;
  },

  // Get market overview for a crop
  async getMarketOverview(crop) {
    const response = await apiClient.get(`/api/market-overview/${crop}`);
    return response.data;
  },

  // Get API information
  async getApiInfo() {
    const response = await apiClient.get('/');
    return response.data;
  },
};

// Export the axios instance for direct use if needed
export default apiClient;
