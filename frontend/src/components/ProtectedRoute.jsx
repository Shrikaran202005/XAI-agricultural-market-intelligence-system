import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, role }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role && userProfile?.role !== role) {
    // Redirect to appropriate dashboard based on user role
    if (userProfile?.role === 'farmer') {
      return <Navigate to="/farmer-dashboard" replace />;
    } else if (userProfile?.role === 'middleman') {
      return <Navigate to="/middleman-dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
