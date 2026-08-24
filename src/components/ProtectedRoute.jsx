import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>;
  }

  if (!currentUser) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (currentUser.colorCode === 'Red') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
