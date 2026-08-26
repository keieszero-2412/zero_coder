import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { X, Check, Trash2, Mail, Plus } from 'lucide-react';
import '../index.css';

export function AdminPanel({ onClose }) {
  const [accessRequests, setAccessRequests] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualEmail, setManualEmail] = useState('');
  const [bypassAuth, setBypassAuth] = useState(false);

  useEffect(() => {
    const qAccess = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
    const unsubscribeAccess = onSnapshot(qAccess, (snapshot) => {
      const reqs = [];
      snapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() });
      });
      reqs.sort((a, b) => {
        if (!a.requestedAt) return 1;
        if (!b.requestedAt) return -1;
        return b.requestedAt.toMillis() - a.requestedAt.toMillis();
      });
      setAccessRequests(reqs);
    });

    const qReset = query(collection(db, 'password_reset_requests'), where('status', '==', 'pending'));
    const unsubscribeReset = onSnapshot(qReset, (snapshot) => {
      const rReqs = [];
      snapshot.forEach((doc) => {
        rReqs.push({ id: doc.id, ...doc.data() });
      });
      rReqs.sort((a, b) => {
        if (!a.requestedAt) return 1;
        if (!b.requestedAt) return -1;
        return b.requestedAt.toMillis() - a.requestedAt.toMillis();
      });
      setResetRequests(rReqs);
      setLoading(false);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'authorized_emails', 'bypass@zerocoder.admin'), (docSnap) => {
      if (docSnap.exists()) {
        setBypassAuth(docSnap.data().bypassBlueCode || false);
      } else {
        setBypassAuth(false);
      }
    });

    return () => {
      unsubscribeAccess();
      unsubscribeReset();
      unsubscribeSettings();
    };
  }, []);

  const handleApprove = async (email, requestId) => {
    try {
      // Add to authorized_emails
      await setDoc(doc(db, 'authorized_emails', email), {
        addedAt: new Date(),
        addedBy: 'Admin'
      });
      // Delete from access_requests
      await deleteDoc(doc(db, 'access_requests', requestId));
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Error approving request.");
    }
  };

  const handleReject = async (requestId) => {
    if (window.confirm("Are you sure you want to reject and delete this request?")) {
      try {
        await deleteDoc(doc(db, 'access_requests', requestId));
      } catch (err) {
        console.error("Failed to reject:", err);
      }
    }
  };

  const handleResolveReset = async (requestId) => {
    if (window.confirm("Did you manually change their password in Firebase Authentication? Click OK to clear this request.")) {
      try {
        await deleteDoc(doc(db, 'password_reset_requests', requestId));
      } catch (err) {
        console.error("Failed to resolve:", err);
      }
    }
  };

  const handleRejectReset = async (requestId) => {
    if (window.confirm("Are you sure you want to deny and delete this password reset request?")) {
      try {
        await deleteDoc(doc(db, 'password_reset_requests', requestId));
      } catch (err) {
        console.error("Failed to reject reset:", err);
      }
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    try {
      await setDoc(doc(db, 'authorized_emails', manualEmail.trim().toLowerCase()), {
        addedAt: new Date(),
        addedBy: 'Admin (Manual)'
      });
      setManualEmail('');
      alert("Email authorized successfully!");
    } catch (err) {
      console.error("Failed to authorize email:", err);
      alert("Error authorizing email.");
    }
  };

  const toggleBypass = async () => {
    try {
      await setDoc(doc(db, 'authorized_emails', 'bypass@zerocoder.admin'), { bypassBlueCode: !bypassAuth }, { merge: true });
    } catch (err) {
      console.error("Failed to toggle bypass:", err);
      alert("Error toggling bypass: " + err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} color="var(--accent-primary)" />
            Access Requests
          </h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem 1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Global Settings</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Bypass Request Access</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Auto accept all emails without requesting access</div>
            </div>
            <button 
              onClick={toggleBypass}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: bypassAuth ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: bypassAuth ? '#22c55e' : 'var(--error)',
                border: '1px solid',
                borderColor: bypassAuth ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                width: '80px',
                textAlign: 'center'
              }}
            >
              {bypassAuth ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Manual Authorization</h3>
          <form onSubmit={handleManualAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="email" 
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="Enter email to grant Blue Code..."
              style={{ flex: 1, padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
              required
            />
            <button type="submit" className="button-primary" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={18} />
              Authorize
            </button>
          </form>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading requests...</p>
          ) : (
            <>
              {/* Access Requests Section */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Access Requests</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '1rem' }}>{accessRequests.length}</span>
                </h3>
                {accessRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem 0' }}>
                    <Check size={32} style={{ opacity: 0.2, margin: '0 auto 0.5rem auto' }} />
                    <p style={{ fontSize: '0.875rem' }}>No pending access requests.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {accessRequests.map(req => (
                      <div key={req.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{req.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                            {req.requestedAt ? new Date(req.requestedAt.toMillis()).toLocaleString() : 'Just now'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleReject(req.id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--error)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Reject"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleApprove(req.email, req.id)}
                            className="button-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Password Reset Requests Section */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Password Reset Requests</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '1rem' }}>{resetRequests.length}</span>
                </h3>
                {resetRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem 0' }}>
                    <Check size={32} style={{ opacity: 0.2, margin: '0 auto 0.5rem auto' }} />
                    <p style={{ fontSize: '0.875rem' }}>No pending password resets.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {resetRequests.map(req => (
                      <div key={req.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{req.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                            {req.requestedAt ? new Date(req.requestedAt.toMillis()).toLocaleString() : 'Just now'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleRejectReset(req.id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--error)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Deny / Reject"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleResolveReset(req.id)}
                            className="button-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            title="Mark as resolved (clears request)"
                          >
                            <Check size={16} style={{ marginRight: '0.25rem' }} />
                            Resolved
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
