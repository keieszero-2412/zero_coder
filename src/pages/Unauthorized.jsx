import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ShieldAlert, LogOut, MailCheck, RefreshCw, Send } from 'lucide-react';
import '../index.css';

export function Unauthorized() {
  const { currentUser, loading, logout, refreshUser } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [requestedCode, setRequestedCode] = useState('Gray');
  const [requestStatus, setRequestStatus] = useState(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!loading && currentUser && currentUser.colorCode !== 'Red') {
      navigate('/', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    let active = true;
    const loadExistingRequest = async () => {
      if (!currentUser?.uid || !db) return;
      const emailLower = (currentUser.email || '').toLowerCase();
      const ids = [...new Set([currentUser.uid, emailLower].filter(Boolean))];
      for (const id of ids) {
        try {
          const snap = await getDoc(doc(db, 'access_requests', id));
          if (snap.exists() && active) {
            setRequestStatus(snap.data().status || null);
            return;
          }
        } catch {
          // Ignore individual lookup failure
        }
      }
    };
    void loadExistingRequest();
    return () => { active = false; };
  }, [currentUser?.uid, currentUser?.email]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleSendVerification = async () => {
    if (!auth.currentUser) return;
    setIsBusy(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
      showToast('Verification email sent. Check your inbox and spam folder.', 'success');
    } catch (err) {
      showToast(err?.message || 'Could not send verification email.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRefresh = async () => {
    setIsBusy(true);
    try {
      await refreshUser();
      showToast('Account status refreshed.', 'info');
    } catch (err) {
      showToast(err?.message || 'Could not refresh status.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!auth.currentUser || !currentUser?.uid) return;
    if (!currentUser.emailVerified) {
      showToast('Please verify your email address before requesting access.', 'error');
      return;
    }
    setIsBusy(true);
    try {
      const safeUsername = (currentUser.username || currentUser.email?.split('@')[0] || 'User').slice(0, 80);
      await setDoc(doc(db, 'access_requests', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        username: safeUsername,
        requestedCode: requestedCode === 'Blue' ? 'Blue' : 'Gray',
        status: 'pending',
        requestedAt: serverTimestamp()
      });
      setRequestStatus('pending');
      showToast('Access request sent to admin.', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to submit access request.', 'error');
    } finally {
      setIsBusy(false);
    }
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
        
        <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
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

        {currentUser && !currentUser.emailVerified ? (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Verify your email address before submitting an access request.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={isBusy}
                className="button-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
              >
                <MailCheck size={17} />
                {verificationSent ? 'Resend Verification Email' : 'Send Verification Email'}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isBusy}
                className="button-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
              >
                <RefreshCw size={17} />
                I&apos;ve Verified — Refresh Status
              </button>
            </div>
          </div>
        ) : currentUser ? (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
            {requestStatus === 'pending' && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                Your access request is pending admin review.
              </div>
            )}
            {requestStatus === 'rejected' && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                Your previous access request was rejected. You may submit a new request below.
              </div>
            )}
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Request workspace access:
            </label>
            <select
              value={requestedCode}
              onChange={(e) => setRequestedCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                marginBottom: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="Gray">Gray Code (Basic Access)</option>
              <option value="Blue">Blue Code (Full Access)</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleRequestAccess}
                disabled={isBusy}
                className="button-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
              >
                <Send size={17} />
                {requestStatus === 'pending' ? 'Update Request' : requestStatus === 'rejected' ? 'Request Again' : 'Request Access'}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isBusy}
                className="button-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
              >
                <RefreshCw size={17} />
                Refresh Access Status
              </button>
            </div>
          </div>
        ) : null}

        <button onClick={handleLogout} className="button-secondary" style={{ display: 'inline-flex', justifyContent: 'center', padding: '0.75rem 2rem' }}>
          <LogOut size={18} />
          Sign Out
        </button>

      </div>
    </div>
  );
}
