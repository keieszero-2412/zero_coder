import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Mail, KeyRound, User, ArrowRight, ShieldAlert, LogIn, UserPlus, ArrowLeft, Send, CheckCircle2, XCircle } from 'lucide-react';
import '../index.css';

export function Auth() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [resetStatus, setResetStatus] = useState(null); // 'email', 'admin', or null
  
  const [isLoading, setIsLoading] = useState(false);
  
  const { checkEmailStatus, login, register, resetPassword, currentUser, loading } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [prefetchedStatus, setPrefetchedStatus] = useState(null);
  const prefetchTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  // Optimistic Prefetch Algorithm
  React.useEffect(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (isValidEmail) {
      prefetchTimeoutRef.current = setTimeout(async () => {
        try {
          const status = await checkEmailStatus(email);
          setPrefetchedStatus({ email, status });
        } catch (e) {
          // ignore background errors
        }
      }, 400); // 400ms debounce
    }
    
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [email, checkEmailStatus]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Use prefetched data if available (Instantaneous UX)
    if (prefetchedStatus && prefetchedStatus.email === email) {
      setEmailStatus(prefetchedStatus.status);
      setRequestSent(false);
      setStep(2);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const status = await checkEmailStatus(email);
      setEmailStatus(status);
      setRequestSent(false); // reset request status
      
      // Proceed to Step 2 to show color code and request password (if authorized)
      // If not authorized, we still go to step 2 to show the Red Code and "Request Access" button
      setStep(2);
    } catch (err) {
      setError("Error checking email status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      setError('');
      if (emailStatus.accountExists) {
        // Log in
        await login(email, password, rememberMe);
      } else {
        // Register
        try {
          await register(username, email, password, rememberMe);
        } catch (regErr) {
          // If Auth account exists but Firestore doc was missing (due to previous partial failures)
          if (regErr.code === 'auth/email-already-in-use') {
            // Try to log them in instead
            await login(email, password, rememberMe);
            // The AuthContext onAuthStateChanged will handle the missing Firestore doc by creating it? 
            // Actually let's manually heal it here to be safe.
            const { db } = await import('../config/firebase');
            const { doc, setDoc } = await import('firebase/firestore');
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            if (auth.currentUser) {
              await setDoc(doc(db, 'users', auth.currentUser.uid), {
                username: username || email.split('@')[0],
                email: email,
                role: emailStatus.role,
                colorCode: emailStatus.colorCode
              });
            }
          } else {
            throw regErr; // rethrow other errors
          }
        }
      }
      // Do not navigate here, the useEffect will trigger when AuthContext updates currentUser
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please reset your password or try again later.');
      } else {
        setError(err.message);
      }
      setIsLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      const { db } = await import('../config/firebase');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      const requestRef = doc(db, 'access_requests', email);
      await setDoc(requestRef, {
        email: email,
        requestedAt: serverTimestamp(),
        status: 'pending'
      });
      
      setRequestSent(true);
      showToast("Your request for access has been sent to the admin. You will be notified once approved.", "success");
    } catch (err) {
      console.error("Failed to send request:", err);
      showToast("Failed to send request. Please try again later.", "error");
    }
  };

  const handlePasswordReset = async () => {
    setIsLoading(true);
    try {
      await resetPassword(email);
      setResetStatus('email');
      setError('');
    } catch (err) {
      setError("Could not send reset email. If your email is not real, please contact admin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminResetRequest = async () => {
    setIsLoading(true);
    try {
      const { db } = await import('../config/firebase');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      const requestRef = doc(db, 'password_reset_requests', email);
      await setDoc(requestRef, {
        email: email,
        requestedAt: serverTimestamp(),
        status: 'pending'
      });
      
      setResetStatus('admin');
      setError('');
      showToast("Your request for password reset has been sent to the admin. You will be notified once approved.", "success");
    } catch (err) {
      console.error("Failed to send reset request:", err);
      setError("Failed to send reset request. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>;
  }

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            <img src="/zerocoder-logo-transparent.png" alt="Logo" style={{ width: '36px', height: '36px', marginTop: '2px' }} />
            zerocoder
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {step === 1 ? 'Enter your email to continue' : 'Authentication'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="name@example.com"
                  autoFocus
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="button-primary" 
              style={{ padding: '0.875rem', fontSize: '1rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Checking Permission...
                </>
              ) : (
                <>
                  Continue <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && emailStatus && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)',
              backgroundColor: emailStatus.colorCode !== 'Red' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: emailStatus.colorCode !== 'Red' ? '#22c55e' : 'var(--error)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: emailStatus.colorCode === 'Green' ? '#22c55e' :
                                   emailStatus.colorCode === 'Blue' ? '#3b82f6' : 
                                   'var(--error)'
                }} />
                <span style={{ fontWeight: 600 }}>Access Code: {emailStatus.colorCode}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                {emailStatus.colorCode !== 'Red' ? (
                  <><CheckCircle2 size={16} /> Access Authorized</>
                ) : (
                  <><XCircle size={16} /> Access Denied</>
                )}
              </div>
            </div>

            {emailStatus.colorCode === 'Red' ? (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  This email is not authorized to access the workspace.
                </p>
                
                {requestSent ? (
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                    Access request sent successfully! An admin will review your request.
                  </div>
                ) : (
                  <button 
                    onClick={handleRequestAccess}
                    className="button-primary" 
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                  >
                    <Send size={18} />
                    Request Access
                  </button>
                )}
                
                <button 
                  onClick={() => { setStep(1); }} 
                  className="button-secondary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '1rem' }}
                >
                  <ArrowLeft size={18} />
                  Use a different email
                </button>
              </div>
            ) : showForgotPwd ? (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Forgot Password?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  If your email is real, we can send you a password reset link. Otherwise, you can request the admin to manually reset it.
                </p>
                
                {resetStatus ? (
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {resetStatus === 'email' 
                      ? "Password reset email sent successfully! Please check your inbox (and spam folder)."
                      : "Request sent successfully! An admin will review your request shortly."}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    <button 
                      onClick={handlePasswordReset}
                      className="button-primary" 
                      style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                      disabled={isLoading}
                    >
                      <Send size={18} />
                      Send Reset Email
                    </button>
                    <button 
                      onClick={handleAdminResetRequest}
                      className="button-secondary" 
                      style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                      disabled={isLoading}
                    >
                      Contact Admin to Reset
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={() => { setShowForgotPwd(false); setResetStatus(null); setError(''); }} 
                  className="button-secondary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', border: 'none', background: 'transparent' }}
                >
                  <ArrowLeft size={18} />
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                {!emailStatus.accountExists && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Choose a Username</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                        placeholder="Username"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                      <KeyRound size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                      placeholder="Password"
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    Remember me
                  </label>
                  
                  {emailStatus.accountExists && (
                    <button 
                      type="button" 
                      onClick={() => setShowForgotPwd(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="button-primary" 
                  style={{ padding: '0.875rem', fontSize: '1rem', width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      {emailStatus.accountExists ? <LogIn size={20} /> : <UserPlus size={20} />}
                      {emailStatus.accountExists ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={() => { setStep(1); }} 
                  className="button-secondary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  <ArrowLeft size={18} />
                  Use a different email
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
