import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';
import '../index.css';

export function Unauthorized() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--error)' }}>
          <ShieldAlert size={64} />
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Access Denied
        </h1>
        
        <div style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            Hello, <strong>{currentUser?.username}</strong>.
          </p>
          <p>
            Your email <strong>{currentUser?.email}</strong> does not have permission to access the zerocoder workspace.
          </p>
          <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>
            Status: Red Code
          </div>
        </div>

        <button onClick={handleLogout} className="button-secondary" style={{ display: 'inline-flex', justifyContent: 'center', padding: '0.75rem 2rem' }}>
          <LogOut size={18} />
          Sign Out
        </button>

      </div>
    </div>
  );
}
