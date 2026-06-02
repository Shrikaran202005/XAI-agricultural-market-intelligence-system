import React, { useState } from 'react';

const MiddlemanInputForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    crop: 'rice',
    demand_quantity: '',
    target_price: '',
    location: 'Tamil Nadu',
    urgency: 'medium'
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
        Demand Analysis
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
            Required Quantity (quintals)
          </label>
          <input
            type="number"
            name="demand_quantity"
            value={formData.demand_quantity}
            onChange={handleInputChange}
            placeholder="Enter required quantity"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
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
            onChange={handleInputChange}
            placeholder="Maximum price you can pay"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Operating Location
          </label>
          <select
            name="location"
            value={formData.location}
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
            Urgency Level
          </label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="low">Low (Can wait)</option>
            <option value="medium">Medium (Flexible)</option>
            <option value="high">High (Immediate need)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze Demand'}
        </button>
      </form>
    </div>
  );
};

export default MiddlemanInputForm;
