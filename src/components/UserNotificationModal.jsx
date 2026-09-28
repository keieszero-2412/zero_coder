import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, ShieldAlert } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function UserNotificationModal({ onClose, notifications }) {
  const [mounted, setMounted] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleDismiss = async (notification) => {
    if (notification.type === 'access_request_rejected' && currentUser?.email) {
      try {
        await updateDoc(doc(db, 'access_requests', currentUser.email), {
          status: 'dismissed_rejected'
        });
      } catch (err) {
        console.error("Failed to dismiss:", err);
      }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} />
          Notifications
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
               No new notifications.
             </div>
          ) : (
            notifications.map((notif, index) => (
              <div key={index} style={{
                padding: '1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{ color: 'var(--error)' }}>
                   <ShieldAlert size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1rem' }}>{notif.title}</h4>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{notif.message}</p>
                  <button
                    onClick={() => {
                      handleDismiss(notif);
                      onClose();
                    }}
                    className="button-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', backgroundColor: 'var(--error)' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
