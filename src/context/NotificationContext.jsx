import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import '../index.css';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // Auto hide toast after 3s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const showConfirm = useCallback((message, onConfirm, onCancel = null) => {
    setConfirmModal({ message, onConfirm, onCancel });
  }, []);

  const closeConfirm = () => {
    if (confirmModal?.onCancel) confirmModal.onCancel();
    setConfirmModal(null);
  };

  const handleConfirmClick = () => {
    if (confirmModal?.onConfirm) confirmModal.onConfirm();
    setConfirmModal(null);
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Toast UI */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: toast.type === 'error' ? 'var(--error)' : toast.type === 'success' ? 'var(--success)' : 'var(--bg-surface-elevated)',
          color: toast.type === 'info' ? 'var(--text-primary)' : '#fff',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          border: toast.type === 'info' ? '1px solid var(--border-color)' : 'none',
          maxWidth: '350px'
        }}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'info' && <Info size={20} color="var(--accent-primary)" />}
          <span style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'inherit', opacity: 0.8, cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Confirm Modal UI */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '400px',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)',
            animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                <AlertCircle size={24} color="var(--error)" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Confirmation Required</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5, fontSize: '0.95rem' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={closeConfirm}
                className="button-secondary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmClick}
                className="button-primary"
                style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--error)', borderColor: 'var(--error)' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
