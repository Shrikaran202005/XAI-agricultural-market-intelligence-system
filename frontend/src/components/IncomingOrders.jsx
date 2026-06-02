import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { doc as authDoc, getDoc as getAuthDoc } from 'firebase/firestore';

const IncomingOrders = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyerNames, setBuyerNames] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [middlemanLocations, setMiddlemanLocations] = useState({});
  const [listingCrops, setListingCrops] = useState({});

  // Fetch buyer name from users collection
  const fetchBuyerName = async (middlemanId) => {
    if (buyerNames[middlemanId]) {
      return buyerNames[middlemanId];
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', middlemanId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const name = userData.name || userData.displayName || userData.email || 'Unknown Buyer';
        setBuyerNames(prev => ({ ...prev, [middlemanId]: name }));
        return name;
      }
      return 'Unknown Buyer';
    } catch (err) {
      console.error('Error fetching buyer name:', err);
      return 'Unknown Buyer';
    }
  };

  // Fetch middleman location from users collection
  const fetchMiddlemanLocation = async (middlemanId) => {
    if (middlemanLocations[middlemanId]) {
      return middlemanLocations[middlemanId];
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', middlemanId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const location = userData.location || userData.state || 'Unknown Location';
        setMiddlemanLocations(prev => ({ ...prev, [middlemanId]: location }));
        return location;
      }
      return 'Unknown Location';
    } catch (err) {
      console.error('Error fetching middleman location:', err);
      return 'Unknown Location';
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

    console.log('IncomingOrders: Fetching orders for farmerId:', currentUser.uid);

    // Real-time listener for farmer's orders
    const q = query(
      collection(db, 'orders'),
      where('farmerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('IncomingOrders: Received snapshot with', snapshot.docs.length, 'orders');
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('IncomingOrders: Orders data:', ordersData);
        setOrders(ordersData);
        
        // Fetch buyer names, middleman locations, and crop names for all orders
        ordersData.forEach(order => {
          if (order.middlemanId) {
            fetchBuyerName(order.middlemanId);
            fetchMiddlemanLocation(order.middlemanId);
          }
          if (order.listingId) {
            fetchCropName(order.listingId);
          }
        });
        
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        setError('Failed to fetch orders: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, refreshTrigger]);

  const handleOrderAction = async (orderId, action) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (action === 'accepted') {
        // Use batch to update multiple documents atomically
        const batch = writeBatch(db);

        // Update the accepted order
        batch.update(doc(db, 'orders', orderId), {
          status: 'accepted'
        });

        // Update the listing status to 'sold'
        batch.update(doc(db, 'crop_listings', order.listingId), {
          status: 'sold'
        });

        // Reject all other orders for the same listing
        const otherOrders = orders.filter(o => o.listingId === order.listingId && o.id !== orderId);
        otherOrders.forEach(otherOrder => {
          batch.update(doc(db, 'orders', otherOrder.id), {
            status: 'rejected'
          });
        });

        // Commit the batch
        await batch.commit();
        console.log('Order accepted and listing marked as sold');
      } else if (action === 'rejected') {
        // For rejection, update the order and check if listing should go back to available
        await updateDoc(doc(db, 'orders', orderId), {
          status: 'rejected'
        });

        // Check if there are any other pending orders for this listing
        const pendingOrders = orders.filter(o => o.listingId === order.listingId && o.status === 'pending' && o.id !== orderId);
        
        // If no pending orders, set listing back to available
        if (pendingOrders.length === 0) {
          await updateDoc(doc(db, 'crop_listings', order.listingId), {
            status: 'available'
          });
          console.log('Order rejected and listing set back to available');
        } else {
          console.log('Order rejected, but other pending orders exist');
        }
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order: ' + err.message);
    }
  };

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-center text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Incoming Orders</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No incoming orders yet.</p>
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
                      <span className="text-gray-600">Buyer:</span>
                      <span className="ml-2 font-medium">{buyerNames[order.middlemanId] || 'Loading...'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleDateString()}
                  </p>
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderAction(order.id, 'accepted')}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, 'rejected')}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
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
                <h4 className="font-semibold text-gray-700 mb-2">Buyer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyer:</span>
                    <span className="font-medium">{buyerNames[selectedOrder.middlemanId] || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Middleman Location:</span>
                    <span className="font-medium">{middlemanLocations[selectedOrder.middlemanId] || 'Loading...'}</span>
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

export default IncomingOrders;
