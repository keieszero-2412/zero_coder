import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Settings, LogOut, Code2, Info } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { SettingsModal } from './SettingsModal';
import { AboutModal } from './AboutModal';
import { useTerm } from '../context/TermContext';
import FeedbackWidget from './FeedbackWidget';

export function GlobalHeader() {
  const { currentUser, logout } = useAuth();
  const { activeTerm, setActiveTerm } = useTerm();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const pendingAccessCount = 0; // Simplified for now, or fetch from context
  const pendingResetCount = 0;

  // Determine visually active tab based on route, fallback to context state
  let visualTerm = activeTerm;
  if (location.pathname.startsWith('/learn')) {
    visualTerm = 'last';
  } else if (location.pathname.startsWith('/workspace')) {
    visualTerm = 'mid';
  }

  const handleTabClick = (term) => {
    setActiveTerm(term);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <header className="header global-header">
      {/* Left Side: Logo */}
      <div className="global-header-left">
        <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="header-title" style={{ fontSize: '1.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <img 
              src="/zerocoder-logo-transparent.png" 
              alt="zerocoder Logo" 
              style={{ 
                width: '36px', 
                height: '36px', 
                objectFit: 'contain', 
                marginRight: '0.5rem',
                borderRadius: '8px'
              }} 
            />
            zerocoder
          </div>
        </a>
      </div>

      {/* Center Side: Tabs (Centered with collision protection) */}
      {currentUser ? (
        <div className="global-header-tabs">
          <div style={{ display: 'inline-flex', gap: '2rem', alignItems: 'center' }}>
            <button
              onClick={() => handleTabClick('mid')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                cursor: 'pointer',
                position: 'relative',
                color: visualTerm === 'mid' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: visualTerm === 'mid' ? 600 : 500,
                fontSize: '1.05rem',
                transition: 'color 0.2s',
              }}
            >
              Mid-term
              {visualTerm === 'mid' && (
                <div style={{ 
                  position: 'absolute', bottom: '-2px', left: 0, width: '100%', height: '3px', 
                  background: 'var(--accent-primary)', borderRadius: '2px', 
                  boxShadow: '0 0 8px color-mix(in srgb, var(--accent-primary) 50%, transparent)' 
                }} />
              )}
            </button>
            <button
              onClick={() => handleTabClick('last')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                cursor: 'pointer',
                position: 'relative',
                color: visualTerm === 'last' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: visualTerm === 'last' ? 600 : 500,
                fontSize: '1.05rem',
                transition: 'color 0.2s',
              }}
            >
              Last-term
              {visualTerm === 'last' && (
                <div style={{ 
                  position: 'absolute', bottom: '-2px', left: 0, width: '100%', height: '3px', 
                  background: 'var(--accent-primary)', borderRadius: '2px', 
                  boxShadow: '0 0 8px color-mix(in srgb, var(--accent-primary) 50%, transparent)' 
                }} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="global-header-tabs" />
      )}

      {/* Right Side: User Controls */}
      <div className="header-right-wrapper global-header-right">
        {currentUser && (
          <div className="dashboard-user-controls">
            {/* 1. Admin button (nếu có quyền Admin) */}
            {currentUser.role === 'Admin' && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="button-secondary header-btn"
                style={{ position: 'relative' }}
                title="Admin Dashboard"
              >
                <Bell size={16} />
                <span className="header-btn-label">Admin</span>
                {(pendingAccessCount > 0 || pendingResetCount > 0) && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px', right: '-5px',
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    width: '18px', height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-surface)'
                  }}>
                    {pendingAccessCount + pendingResetCount}
                  </span>
                )}
              </button>
            )}

            {/* 2. Feedback */}
            <FeedbackWidget />

            {/* 3. Settings */}
            <button 
              onClick={() => setShowSettings(true)} 
              className="button-secondary header-btn" 
              title="Settings"
            >
              <Settings size={16} />
              <span className="header-btn-label">Settings</span>
            </button>

            {/* 4. About Project - Đặt ở đây (ngay trước Username) */}
            <button
              onClick={() => setShowAbout(true)}
              className="button-secondary header-btn"
              title="About Project"
            >
              <img 
                src="/zerocoder-logo-transparent.png" 
                alt="logo" 
                className="about-btn-logo" 
                style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }} 
              />
              <span className="header-btn-label">About Project</span>
            </button>

            {/* Đường phân cách tinh tế giữa cụm tính năng và user profile */}
            <div className="header-divider hide-on-mobile" />

            {/* 5. User name với code ở ngay trước nút logout */}
            <div className="dashboard-user-profile" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '0.375rem', rowGap: '0.125rem', alignItems: 'center' }}>
              <span style={{ gridColumn: 2, fontSize: '0.875rem', fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.username}
              </span>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: currentUser.colorCode === 'Green' ? '#10b981' : 
                                 currentUser.colorCode === 'Blue' ? '#3b82f6' : 'var(--error)' 
              }} />
              <div style={{ 
                fontSize: '0.75rem', 
                lineHeight: 1,
                color: currentUser.colorCode === 'Green' ? '#10b981' : 
                       currentUser.colorCode === 'Blue' ? '#3b82f6' : 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}>
                Code: {currentUser.colorCode}
              </div>
            </div>

            {/* 6. Nút Logout */}
            <button 
              onClick={logout} 
              className="button-secondary header-btn" 
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="header-btn-label">Logout</span>
            </button>
          </div>
        )}
      </div>

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </header>
  );
}
