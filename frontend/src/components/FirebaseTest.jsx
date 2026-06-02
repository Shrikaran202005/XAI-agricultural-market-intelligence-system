import React, { useState, useEffect } from 'react';
import { auth, db, analytics } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, limit } from 'firebase/firestore';

const FirebaseTest = () => {
  const [authStatus, setAuthStatus] = useState('checking');
  const [firestoreStatus, setFirestoreStatus] = useState('checking');
  const [analyticsStatus, setAnalyticsStatus] = useState('checking');
  const [currentUser, setCurrentUser] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    runFirebaseTests();
  }, []);

  const runFirebaseTests = async () => {
    const results = [];

    // Test Authentication
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthStatus('connected');
        results.push({
          test: 'Authentication',
          status: 'success',
          message: user ? `User authenticated: ${user.email}` : 'No user currently authenticated'
        });
      });
      
      // Test if auth is properly initialized
      if (auth) {
        setAuthStatus('connected');
      } else {
        setAuthStatus('error');
        results.push({
          test: 'Authentication',
          status: 'error',
          message: 'Auth not initialized'
        });
      }
      
      unsubscribe();
    } catch (error) {
      setAuthStatus('error');
      results.push({
        test: 'Authentication',
        status: 'error',
        message: error.message
      });
    }

    // Test Firestore
    try {
      if (db) {
        // Try to access a collection (this will test connectivity)
        const testQuery = query(collection(db, 'users'), limit(1));
        await getDocs(testQuery);
        setFirestoreStatus('connected');
        results.push({
          test: 'Firestore',
          status: 'success',
          message: 'Firestore connected successfully'
        });
      } else {
        setFirestoreStatus('error');
        results.push({
          test: 'Firestore',
          status: 'error',
          message: 'Firestore not initialized'
        });
      }
    } catch (error) {
      setFirestoreStatus('error');
      results.push({
        test: 'Firestore',
        status: 'error',
        message: error.message
      });
    }

    // Test Analytics
    try {
      if (analytics) {
        setAnalyticsStatus('connected');
        results.push({
          test: 'Analytics',
          status: 'success',
          message: 'Analytics initialized successfully'
        });
      } else {
        // Analytics might not be initialized in development
        setAnalyticsStatus('not_available');
        results.push({
          test: 'Analytics',
          status: 'info',
          message: 'Analytics not available in development mode'
        });
      }
    } catch (error) {
      setAnalyticsStatus('error');
      results.push({
        test: 'Analytics',
        status: 'error',
        message: error.message
      });
    }

    setTestResults(results);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'not_available':
      case 'info':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'success':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Firebase Integration Test</h3>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(authStatus)}`}>
          {getStatusIcon(authStatus)}
          <span className="ml-2">Auth: {authStatus}</span>
        </div>
        
        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(firestoreStatus)}`}>
          {getStatusIcon(firestoreStatus)}
          <span className="ml-2">Firestore: {firestoreStatus}</span>
        </div>
        
        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(analyticsStatus)}`}>
          {getStatusIcon(analyticsStatus)}
          <span className="ml-2">Analytics: {analyticsStatus}</span>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">Test Results:</h4>
        {testResults.map((result, index) => (
          <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
            <div className="flex items-center">
              {getStatusIcon(result.status)}
              <span className="ml-2 font-medium capitalize">{result.test}</span>
            </div>
            <p className="mt-1 text-sm">{result.message}</p>
          </div>
        ))}
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current User:</h4>
          <p className="text-sm text-blue-700">Email: {currentUser.email}</p>
          <p className="text-sm text-blue-700">UID: {currentUser.uid}</p>
        </div>
      )}

      {/* Firebase Config Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Firebase Configuration:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Project ID: farmer-market-prediction</p>
          <p>Auth Domain: farmer-market-prediction.firebaseapp.com</p>
          <p>Storage: farmer-market-prediction.firebasestorage.app</p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest;
