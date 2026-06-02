import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';

const BrowseListings = ({ onOrderCreated }) => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    crop: '',
    location: '',
    status: 'available'
  });
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    // Build query with filters - always filter by status first for performance
    const constraints = [];
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.crop) {
      constraints.push(where('crop', '==', filters.crop));
    }
    if (filters.location) {
      constraints.push(where('location', '==', filters.location));
    }

    // Build query with limit for performance
    let q;
    if (constraints.length > 0) {
      q = query(collection(db, 'crop_listings'), ...constraints, limit(50));
    } else {
      q = query(collection(db, 'crop_listings'), where('status', '==', 'available'), limit(50));
    }

    // Real-time listener for listings
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
  }, [filters]);

  const handleAcceptDeal = async (listing) => {
    try {
      console.log('Accepting deal for listing:', listing.id);
      console.log('Creating order with data:', {
        listingId: listing.id,
        farmerId: listing.farmerId,
        middlemanId: currentUser.uid,
        agreed_price: listing.expected_price,
        quantity: listing.quantity,
        status: 'pending'
      });

      // Create order in Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        listingId: listing.id,
        farmerId: listing.farmerId,
        middlemanId: currentUser.uid,
        agreed_price: listing.expected_price,
        quantity: listing.quantity,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      console.log('Order created successfully with ID:', orderRef.id);

      // Update listing status to 'sold'
      await updateDoc(doc(db, 'crop_listings', listing.id), {
        status: 'sold'
      });

      console.log('Listing status updated to sold');
      alert('Deal accepted successfully!');
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      console.error('Error accepting deal:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      alert('Failed to accept deal: ' + err.message);
    }
  };

  const handleProposePrice = (listing) => {
    setSelectedListing(listing);
    setProposedPrice(listing.expected_price.toString());
    setShowProposeModal(true);
  };

  const submitProposal = async () => {
    if (!selectedListing || !proposedPrice) return;

    try {
      // Create order with proposed price
      const orderRef = await addDoc(collection(db, 'orders'), {
        listingId: selectedListing.id,
        farmerId: selectedListing.farmerId,
        middlemanId: currentUser.uid,
        agreed_price: parseFloat(proposedPrice),
        quantity: selectedListing.quantity,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Update listing status to 'negotiation' only if it's currently 'available'
      if (selectedListing.status === 'available') {
        await updateDoc(doc(db, 'crop_listings', selectedListing.id), {
          status: 'negotiation'
        });
      }

      alert('Price proposal sent successfully!');
      setShowProposeModal(false);
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      console.error('Error proposing price:', err);
      alert('Failed to propose price: ' + err.message);
    }
  };

  const crops = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Pulses', 'Onion', 'Potato', 'Tomato', 'Brinjal'];
  const states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Maharashtra', 
                 'Gujarat', 'Rajasthan', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-center text-gray-600">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🌾 Browse Listings</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <select
              value={filters.crop}
              onChange={(e) => setFilters({...filters, crop: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Crops</option>
              {crops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-lg font-semibold text-gray-800">{listing.crop}</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{listing.quantity} quintals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">₹{listing.expected_price}/quintal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{listing.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ready Date:</span>
                  <span className="font-medium">{listing.ready_date}</span>
                </div>
              </div>

              {listing.status === 'available' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAcceptDeal(listing)}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Accept Deal
                  </button>
                  <button
                    onClick={() => handleProposePrice(listing)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Propose Price
                  </button>
                </div>
              )}

              {listing.status === 'negotiation' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleProposePrice(listing)}
                    className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Propose Your Price
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Propose Price Modal */}
      {showProposeModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Propose Price</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current Price: ₹{selectedListing.expected_price}/quintal
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Proposed Price (₹/quintal)
              </label>
              <input
                type="number"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={submitProposal}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Send Proposal
              </button>
              <button
                onClick={() => setShowProposeModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseListings;
