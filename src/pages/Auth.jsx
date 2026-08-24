import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  
  const [isLoading, setIsLoading] = useState(false);
  
  const { checkEmailStatus, login, register, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  React.useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        await login(email, password);
      } else {
        // Register
        await register(username, email, password);
      }
      // Do not navigate here, the useEffect will trigger when AuthContext updates currentUser
    } catch (err) {
      setError(err.message);
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
      window.alert("Your request for access has been sent to the admin. You will be notified once approved.");
    } catch (err) {
      console.error("Failed to send request:", err);
      window.alert("Failed to send request. Please try again later.");
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            <img src="/zerocoder-logo.png" alt="Logo" style={{ width: '40px', height: '40px' }} />
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
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
