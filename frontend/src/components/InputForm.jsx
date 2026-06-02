import React, { useState } from 'react';

const InputForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    crop: 'rice',
    quantity: '',
    state: 'Tamil Nadu',
    investment: '',
    transport_cost: '',
    storage_cost: '',
    harvest_date: ''
  });

  const crops = [
    'rice', 'wheat', 'cotton', 'sugarcane', 'maize', 
    'pulses', 'vegetables', 'fruits', 'groundnut', 'mustard'
  ];

  const states = [
    'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Maharashtra',
    'Gujarat', 'Rajasthan', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh',
    'West Bengal', 'Bihar', 'Odisha', 'Haryana', 'Delhi'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Crop Information
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Crop Type
          </label>
          <select
            name="crop"
            value={formData.crop}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {crops.map(crop => (
              <option key={crop} value={crop}>
                {crop.charAt(0).toUpperCase() + crop.slice(1)}
              </option>
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
            onChange={handleInputChange}
            placeholder="Enter quantity in quintals"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Investment Cost (Rs)
          </label>
          <input
            type="number"
            name="investment"
            value={formData.investment}
            onChange={handleInputChange}
            placeholder="Total investment amount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
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
            onChange={handleInputChange}
            placeholder="Transportation expenses"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
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
            onChange={handleInputChange}
            placeholder="Storage expenses"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Harvest Date
          </label>
          <input
            type="date"
            name="harvest_date"
            value={formData.harvest_date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Get Price Prediction'}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
