"""
Firestore service for marketplace operations
Handles crop listings and orders
"""
from datetime import datetime
import json

# Firebase Admin SDK - optional for development
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    # Initialize Firebase Admin SDK
    try:
        # For development, you might use a service account key
        # For production, use environment variables or Firebase Admin SDK auto-detection
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': 'farmer-market-prediction'
        })
        db = firestore.client()
        print("✅ Firestore initialized successfully")
    except Exception as e:
        print(f"⚠️ Firestore initialization failed: {e}")
        print("Marketplace features will use mock data")
        db = None
except ImportError:
    print("⚠️ firebase_admin not installed. Marketplace features will use mock data")
    db = None


class MarketplaceService:
    """Service for marketplace operations"""
    
    def __init__(self, firestore_db=None):
        self.db = firestore_db or db
        self.use_mock = self.db is None
        
    def create_listing(self, listing_data):
        """Create a new crop listing"""
        if self.use_mock:
            return self._mock_create_listing(listing_data)
        
        try:
            listing_ref = self.db.collection('crop_listings').document()
            listing_id = listing_ref.id
            
            listing_data['id'] = listing_id
            listing_data['createdAt'] = datetime.utcnow().isoformat()
            listing_data['status'] = listing_data.get('status', 'available')
            
            listing_ref.set(listing_data)
            print(f"[MARKETPLACE] Created listing: {listing_id}")
            return {'success': True, 'listing_id': listing_id, 'listing': listing_data}
        except Exception as e:
            print(f"[ERROR] Failed to create listing: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_listings(self, crop_filter=None, location_filter=None, status_filter='available'):
        """Get all listings with optional filters"""
        if self.use_mock:
            return self._mock_get_listings(crop_filter, location_filter, status_filter)
        
        try:
            query = self.db.collection('crop_listings')
            
            if status_filter:
                query = query.where('status', '==', status_filter)
            if crop_filter:
                query = query.where('crop', '==', crop_filter)
            if location_filter:
                query = query.where('location', '==', location_filter)
            
            listings = query.stream()
            listings_data = [doc.to_dict() for doc in listings]
            
            print(f"[MARKETPLACE] Retrieved {len(listings_data)} listings")
            return {'success': True, 'listings': listings_data}
        except Exception as e:
            print(f"[ERROR] Failed to get listings: {e}")
            return {'success': False, 'error': str(e), 'listings': []}
    
    def get_my_listings(self, farmer_id):
        """Get all listings for a specific farmer"""
        if self.use_mock:
            return self._mock_get_my_listings(farmer_id)
        
        try:
            listings = self.db.collection('crop_listings').where('farmerId', '==', farmer_id).stream()
            listings_data = [doc.to_dict() for doc in listings]
            
            print(f"[MARKETPLACE] Retrieved {len(listings_data)} listings for farmer {farmer_id}")
            return {'success': True, 'listings': listings_data}
        except Exception as e:
            print(f"[ERROR] Failed to get farmer listings: {e}")
            return {'success': False, 'error': str(e), 'listings': []}
    
    def update_listing_status(self, listing_id, status):
        """Update listing status"""
        if self.use_mock:
            return self._mock_update_listing_status(listing_id, status)
        
        try:
            listing_ref = self.db.collection('crop_listings').document(listing_id)
            listing_ref.update({'status': status})
            
            print(f"[MARKETPLACE] Updated listing {listing_id} to {status}")
            return {'success': True}
        except Exception as e:
            print(f"[ERROR] Failed to update listing: {e}")
            return {'success': False, 'error': str(e)}
    
    def create_order(self, order_data):
        """Create a new order"""
        if self.use_mock:
            return self._mock_create_order(order_data)
        
        try:
            order_ref = self.db.collection('orders').document()
            order_id = order_ref.id
            
            order_data['id'] = order_id
            order_data['createdAt'] = datetime.utcnow().isoformat()
            order_data['status'] = order_data.get('status', 'pending')
            
            order_ref.set(order_data)
            print(f"[MARKETPLACE] Created order: {order_id}")
            return {'success': True, 'order_id': order_id, 'order': order_data}
        except Exception as e:
            print(f"[ERROR] Failed to create order: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_orders(self, user_id, user_type='farmer'):
        """Get orders for a user (farmer or middleman)"""
        if self.use_mock:
            return self._mock_get_orders(user_id, user_type)
        
        try:
            if user_type == 'farmer':
                orders = self.db.collection('orders').where('farmerId', '==', user_id).stream()
            else:
                orders = self.db.collection('orders').where('middlemanId', '==', user_id).stream()
            
            orders_data = [doc.to_dict() for doc in orders]
            
            print(f"[MARKETPLACE] Retrieved {len(orders_data)} orders for {user_type} {user_id}")
            return {'success': True, 'orders': orders_data}
        except Exception as e:
            print(f"[ERROR] Failed to get orders: {e}")
            return {'success': False, 'error': str(e), 'orders': []}
    
    def update_order_status(self, order_id, status):
        """Update order status"""
        if self.use_mock:
            return self._mock_update_order_status(order_id, status)
        
        try:
            order_ref = self.db.collection('orders').document(order_id)
            order_ref.update({'status': status})
            
            print(f"[MARKETPLACE] Updated order {order_id} to {status}")
            return {'success': True}
        except Exception as e:
            print(f"[ERROR] Failed to update order: {e}")
            return {'success': False, 'error': str(e)}
    
    # Mock implementations for development without Firestore
    def _mock_create_listing(self, listing_data):
        import uuid
        listing_id = str(uuid.uuid4())
        listing_data['id'] = listing_id
        listing_data['createdAt'] = datetime.utcnow().isoformat()
        listing_data['status'] = listing_data.get('status', 'available')
        return {'success': True, 'listing_id': listing_id, 'listing': listing_data}
    
    def _mock_get_listings(self, crop_filter=None, location_filter=None, status_filter='available'):
        mock_listings = [
            {
                'id': '1',
                'farmerId': 'farmer1',
                'crop': 'Rice',
                'quantity': 500,
                'expected_price': 2500,
                'ready_date': '2025-05-15',
                'location': 'Tamil Nadu',
                'status': 'available',
                'createdAt': '2025-04-12T10:30:00Z'
            },
            {
                'id': '2',
                'farmerId': 'farmer2',
                'crop': 'Wheat',
                'quantity': 1000,
                'expected_price': 2200,
                'ready_date': '2025-05-20',
                'location': 'Karnataka',
                'status': 'available',
                'createdAt': '2025-04-12T11:45:00Z'
            },
            {
                'id': '3',
                'farmerId': 'farmer3',
                'crop': 'Cotton',
                'quantity': 300,
                'expected_price': 6000,
                'ready_date': '2025-05-25',
                'location': 'Maharashtra',
                'status': 'available',
                'createdAt': '2025-04-12T12:00:00Z'
            }
        ]
        
        filtered = mock_listings
        if crop_filter:
            filtered = [l for l in filtered if l['crop'].lower() == crop_filter.lower()]
        if location_filter:
            filtered = [l for l in filtered if l['location'].lower() == location_filter.lower()]
        if status_filter:
            filtered = [l for l in filtered if l['status'] == status_filter]
        
        return {'success': True, 'listings': filtered}
    
    def _mock_get_my_listings(self, farmer_id):
        return self._mock_get_listings(status_filter=None)
    
    def _mock_update_listing_status(self, listing_id, status):
        return {'success': True}
    
    def _mock_create_order(self, order_data):
        import uuid
        order_id = str(uuid.uuid4())
        order_data['id'] = order_id
        order_data['createdAt'] = datetime.utcnow().isoformat()
        order_data['status'] = order_data.get('status', 'pending')
        return {'success': True, 'order_id': order_id, 'order': order_data}
    
    def _mock_get_orders(self, user_id, user_type='farmer'):
        mock_orders = [
            {
                'id': 'order1',
                'listingId': '1',
                'farmerId': 'farmer1',
                'middlemanId': 'middleman1',
                'agreed_price': 2500,
                'quantity': 500,
                'status': 'pending',
                'createdAt': '2025-04-12T14:30:00Z'
            }
        ]
        return {'success': True, 'orders': mock_orders}
    
    def _mock_update_order_status(self, order_id, status):
        return {'success': True}


# Initialize marketplace service
marketplace_service = MarketplaceService()
