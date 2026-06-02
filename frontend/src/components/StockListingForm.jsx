import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const StockListingForm = ({ onListingCreated }) => {
  const [formData, setFormData] = useState({
    crop: 'Rice',
    quantity: '100',
    expected_price: '2500',
    location: 'Tamil Nadu',
    ready_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { currentUser } = useAuth();

  const crops = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Pulses', 'Onion', 'Potato', 'Tomato', 'Brinjal'];
  const states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Maharashtra', 
                 'Gujarat', 'Rajasthan', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh'];

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Set default ready date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      ready_date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creating listing with data:', {
        farmerId: currentUser.uid,
        crop: formData.crop,
        quantity: parseFloat(formData.quantity),
        expected_price: parseFloat(formData.expected_price),
        ready_date: formData.ready_date,
        location: formData.location,
        status: 'available'
      });

      // Save to Firestore using addDoc
      const docRef = await addDoc(collection(db, 'crop_listings'), {
        farmerId: currentUser.uid,
        crop: formData.crop,
        quantity: parseFloat(formData.quantity),
        expected_price: parseFloat(formData.expected_price),
        ready_date: formData.ready_date,
        location: formData.location,
        status: 'available',
        createdAt: serverTimestamp()
      });

      console.log('Listing created successfully with ID:', docRef.id);
      setSuccess('Stock listed successfully!');
      
      // Reset form and loading state immediately
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFormData({
        crop: 'Rice',
        quantity: '100',
        expected_price: '2500',
        ready_date: tomorrow.toISOString().split('T')[0],
        location: 'Tamil Nadu'
      });
      
      setLoading(false);
      
      if (onListingCreated) {
        onListingCreated({ id: docRef.id, ...formData });
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating listing:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      setError('Failed to create listing: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🌾 List Your Crop Stock</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

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
              <option key={crop} value={crop}>{crop}</option>
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
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Price (₹/quintal)
          </label>
          <input
            type="number"
            name="expected_price"
            value={formData.expected_price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ready Date
          </label>
          <input
            type="date"
            name="ready_date"
            value={formData.ready_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (State)
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Listing...' : 'List Stock'}
        </button>
      </form>
    </div>
  );
};

export default StockListingForm;
