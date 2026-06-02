import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FarmerDashboard from './pages/FarmerDashboard';
import MiddlemanDashboard from './pages/MiddlemanDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import FirebaseTest from './components/FirebaseTest';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function AppContent() {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner message="Initializing application..." />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/farmer-dashboard" element={
          <ProtectedRoute role="farmer">
            <FarmerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/middleman-dashboard" element={
          <ProtectedRoute role="middleman">
            <MiddlemanDashboard />
          </ProtectedRoute>
        } />
        <Route path="/firebase-test" element={<FirebaseTest />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
