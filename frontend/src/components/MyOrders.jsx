import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

const MyOrders = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [farmerNames, setFarmerNames] = useState({});
  const [listingCrops, setListingCrops] = useState({});

  // Fetch farmer name from users collection
  const fetchFarmerName = async (farmerId) => {
    if (farmerNames[farmerId]) {
      return farmerNames[farmerId];
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', farmerId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const name = userData.name || userData.displayName || userData.email || 'Unknown Farmer';
        setFarmerNames(prev => ({ ...prev, [farmerId]: name }));
        return name;
      }
      return 'Unknown Farmer';
    } catch (err) {
      console.error('Error fetching farmer name:', err);
      return 'Unknown Farmer';
    }
  };

  // Fetch crop name from crop_listings
  const fetchCropName = async (listingId) => {
    if (listingCrops[listingId]) {
      return listingCrops[listingId];
    }

    try {
      const listingDoc = await getDoc(doc(db, 'crop_listings', listingId));
      if (listingDoc.exists()) {
        const listingData = listingDoc.data();
        const crop = listingData.crop || 'Unknown Crop';
        setListingCrops(prev => ({ ...prev, [listingId]: crop }));
        return crop;
      }
      return 'Unknown Crop';
    } catch (err) {
      console.error('Error fetching crop name:', err);
      return 'Unknown Crop';
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    // Real-time listener for middleman's orders
    const q = query(
      collection(db, 'orders'),
      where('middlemanId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        
        // Fetch farmer names and crop names for all orders
        ordersData.forEach(order => {
          if (order.farmerId) {
            fetchFarmerName(order.farmerId);
          }
          if (order.listingId) {
            fetchCropName(order.listingId);
          }
        });
        
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, refreshTrigger]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-center text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 My Orders</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders yet. Browse listings to make your first purchase!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedOrder(order); setShowDetails(true); }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold text-gray-800">Order #{order.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Crop:</span>
                    <span className="ml-2 font-medium text-gray-800">{listingCrops[order.listingId] || 'Loading...'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-2 font-medium">{order.quantity} quintals</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Agreed Price:</span>
                      <span className="ml-2 font-medium">₹{order.agreed_price}/quintal</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Listing ID:</span>
                      <span className="ml-2 font-medium">{order.listingId}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Farmer:</span>
                      <span className="ml-2 font-medium">{farmerNames[order.farmerId] || 'Loading...'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Order Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Order Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono font-medium">{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(selectedOrder.createdAt?.toDate?.() || selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crop:</span>
                    <span className="font-medium">{listingCrops[selectedOrder.listingId] || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{selectedOrder.quantity} quintals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agreed Price:</span>
                    <span className="font-medium">₹{selectedOrder.agreed_price}/quintal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">₹{(selectedOrder.quantity * selectedOrder.agreed_price).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Listing Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listing ID:</span>
                    <span className="font-mono font-medium text-xs">{selectedOrder.listingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Farmer:</span>
                    <span className="font-medium">{farmerNames[selectedOrder.farmerId] || 'Loading...'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
