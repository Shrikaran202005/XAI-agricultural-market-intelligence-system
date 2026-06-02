import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const MyListings = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingListing, setEditingListing] = useState(null);
  const [editFormData, setEditFormData] = useState({
    crop: '',
    quantity: '',
    expected_price: '',
    ready_date: '',
    location: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    // Real-time listener for farmer's listings
    const q = query(
      collection(db, 'crop_listings'),
      where('farmerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const listingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setListings(listingsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching listings:', err);
        setError('Failed to fetch listings: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, refreshTrigger]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (listing) => {
    setEditingListing(listing.id);
    setEditFormData({
      crop: listing.crop,
      quantity: listing.quantity,
      expected_price: listing.expected_price,
      ready_date: listing.ready_date,
      location: listing.location
    });
  };

  const handleDelete = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await deleteDoc(doc(db, 'crop_listings', listingId));
      console.log('Listing deleted successfully');
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete listing: ' + err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    
    try {
      console.log('Updating listing:', editingListing, 'with data:', editFormData);
      
      await updateDoc(doc(db, 'crop_listings', editingListing), {
        crop: editFormData.crop,
        quantity: parseFloat(editFormData.quantity),
        expected_price: parseFloat(editFormData.expected_price),
        ready_date: editFormData.ready_date,
        location: editFormData.location
      });
      
      setEditingListing(null);
      setEditLoading(false);
      console.log('Listing updated successfully');
    } catch (err) {
      console.error('Error updating listing:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      setEditError('Failed to update listing: ' + err.message);
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingListing(null);
    setEditFormData({
      crop: '',
      quantity: '',
      expected_price: '',
      ready_date: '',
      location: ''
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-center text-gray-600">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 My Listings</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No listings yet. List your first crop stock!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold text-gray-800">{listing.crop}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-2 font-medium">{listing.quantity} quintals</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <span className="ml-2 font-medium">₹{listing.expected_price}/quintal</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ready Date:</span>
                      <span className="ml-2 font-medium">{listing.ready_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{listing.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(listing.createdAt?.toDate?.() || listing.createdAt).toLocaleDateString()}
                  </p>
                  {listing.status === 'available' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(listing)}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {editingListing === listing.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {editError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                      <p className="text-red-700 text-xs">{editError}</p>
                    </div>
                  )}
                  <form onSubmit={handleSaveEdit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Crop</label>
                        <input
                          type="text"
                          value={editFormData.crop}
                          onChange={(e) => setEditFormData({...editFormData, crop: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={editFormData.quantity}
                          onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                        <input
                          type="number"
                          value={editFormData.expected_price}
                          onChange={(e) => setEditFormData({...editFormData, expected_price: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Ready Date</label>
                        <input
                          type="date"
                          value={editFormData.ready_date}
                          onChange={(e) => setEditFormData({...editFormData, ready_date: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={editFormData.location}
                          onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={editLoading}
                        className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={editLoading}
                        className="flex-1 bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
