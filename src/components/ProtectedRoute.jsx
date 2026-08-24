import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (currentUser.colorCode === 'Red') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
