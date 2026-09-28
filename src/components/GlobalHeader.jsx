import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Settings, LogOut } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { SettingsModal } from './SettingsModal';
import { AboutModal } from './AboutModal';
import { UserNotificationModal } from './UserNotificationModal';
import { useTerm } from '../context/TermContext';
import { useProblems } from '../context/ProblemsContext';
import FeedbackWidget from './FeedbackWidget';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function GlobalHeader() {
  const { currentUser, logout } = useAuth();
  const { activeTerm, setActiveTerm } = useTerm();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showUserNotif, setShowUserNotif] = useState(false);
  const [userNotifications, setUserNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { problems } = useProblems();
  
  const [lastViewedNoti, setLastViewedNoti] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_last_viewed_noti');
      return stored ? Number(stored) : 0;
    } catch {
      return 0;
    }
  });
  const [adminNotificationCount, setAdminNotificationCount] = useState(0);

  // Sync last viewed time from Firestore if available
  useEffect(() => {
    if (currentUser?.adminLastViewedAt) {
      const fsTime = currentUser.adminLastViewedAt.toMillis ? currentUser.adminLastViewedAt.toMillis() : new Date(currentUser.adminLastViewedAt).getTime();
      if (fsTime > lastViewedNoti) {
        setLastViewedNoti(fsTime);
        try {
          localStorage.setItem('admin_last_viewed_noti', String(fsTime));
        } catch {}
      }
    }
  }, [currentUser, lastViewedNoti]);

  const markAdminNotificationsAsSeen = () => {
    const now = Date.now();
    setLastViewedNoti(now);
    setAdminNotificationCount(0);
    try {
      localStorage.setItem('admin_last_viewed_noti', String(now));
    } catch {}
    if (currentUser?.uid) {
      updateDoc(doc(db, 'users', currentUser.uid), {
        adminLastViewedAt: serverTimestamp()
      }).catch(() => {});
    }
  };

  const handleOpenAdminPanel = () => {
    setShowAdminPanel(true);
    markAdminNotificationsAsSeen();
  };

  const handleCloseAdminPanel = () => {
    setShowAdminPanel(false);
    markAdminNotificationsAsSeen();
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Admin') {
      setAdminNotificationCount(0);
      return;
    }

    const getDocTime = (data) => {
      const ts = data.updatedAt || data.requestedAt || data.createdAt;
      if (!ts) return 0;
      if (typeof ts.toMillis === 'function') return ts.toMillis();
      if (ts instanceof Date) return ts.getTime();
      if (typeof ts === 'number') return ts;
      const parsed = new Date(ts).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    let rawAccessDocs = [];
    let rawFeedbackDocs = [];

    const recalculateCount = () => {
      let count = 0;

      // 1. Pending access requests created after lastViewedNoti
      for (const data of rawAccessDocs) {
        const time = getDocTime(data);
        if (time > lastViewedNoti) {
          count++;
        }
      }

      // 2. Feedbacks needing admin attention created/updated after lastViewedNoti
      for (const data of rawFeedbackDocs) {
        if (data.status === 'new' || data.status === 'user_replied' || !data.status || data.status === 'pending') {
          const time = getDocTime(data);
          if (time > lastViewedNoti) {
            count++;
          }
        }
      }

      setAdminNotificationCount(count);
    };

    // 1. Listen to pending access requests
    const qAccess = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
    const unsubscribeAccess = onSnapshot(qAccess, (snapshot) => {
      rawAccessDocs = snapshot.docs.map(d => d.data());
      recalculateCount();
    }, (err) => {
      console.error("Error listening to access requests:", err);
    });

    // 2. Listen to feedbacks needing admin attention
    const qFeedback = collection(db, 'feedbacks');
    const unsubscribeFeedback = onSnapshot(qFeedback, (snapshot) => {
      rawFeedbackDocs = snapshot.docs.map(d => d.data());
      recalculateCount();
    }, (err) => {
      console.error("Error listening to feedbacks:", err);
    });

    return () => {
      unsubscribeAccess();
      unsubscribeFeedback();
    };
  }, [currentUser, lastViewedNoti]);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'Admin') return;
    
    // For non-admin users, check if they have a rejected access request
    const unsubscribe = onSnapshot(doc(db, 'access_requests', currentUser.email), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'rejected') {
          setUserNotifications([{
            type: 'access_request_rejected',
            title: 'Access Request Rejected',
            message: `Your request for ${data.requestedCode || 'Blue'} Code access was declined by the admin.`,
            timestamp: data.requestedAt
          }]);
        } else {
          setUserNotifications([]);
        }
      } else {
        setUserNotifications([]);
      }
    }, (err) => {
      console.error("Error listening to user notifications:", err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Determine visually active tab based on route, fallback to context state
  let visualTerm = activeTerm;
  if (location.pathname.startsWith('/learn')) {
    visualTerm = 'last';
  } else if (location.pathname.startsWith('/workspace/')) {
    const id = location.pathname.split('/workspace/')[1];
    const currentProblem = problems.find(p => p.id === id || p.id === Number(id));
    if (currentProblem) {
      const cat = (currentProblem.category || '').toLowerCase();
      visualTerm = (cat.includes('final') || cat.includes('last')) ? 'last' : 'mid';
    } else {
      visualTerm = 'mid';
    }
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
                onClick={handleOpenAdminPanel}
                className="button-secondary header-btn"
                style={{ position: 'relative', overflow: 'visible' }}
                title="Admin Dashboard"
              >
                <Bell size={16} />
                <span className="header-btn-label">Admin</span>
                {adminNotificationCount > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-5px', 
                      right: '-5px',
                      backgroundColor: 'var(--error)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      minWidth: '18px', 
                      height: '18px',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      border: '2px solid var(--bg-surface)',
                      zIndex: 10,
                      pointerEvents: 'none',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                      lineHeight: 1
                    }}
                    title={`${adminNotificationCount} unread notification${adminNotificationCount > 1 ? 's' : ''}`}
                  >
                    {adminNotificationCount > 99 ? '99+' : adminNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* 2. User Notification button (nếu có quyền User) */}
            {currentUser.role !== 'Admin' && (
              <button 
                onClick={() => setShowUserNotif(true)}
                className="button-secondary header-btn"
                style={{ position: 'relative', overflow: 'visible' }}
                title="Notifications"
              >
                <Bell size={16} />
                <span className="header-btn-label">Notifications</span>
                {userNotifications.length > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-5px', 
                      right: '-5px',
                      backgroundColor: 'var(--error)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      minWidth: '18px', 
                      height: '18px',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      border: '2px solid var(--bg-surface)',
                      zIndex: 10,
                      pointerEvents: 'none',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                      lineHeight: 1
                    }}
                    title={`${userNotifications.length} unread notification${userNotifications.length > 1 ? 's' : ''}`}
                  >
                    {userNotifications.length}
                  </span>
                )}
              </button>
            )}

            {/* 3. Feedback */}
            <FeedbackWidget />

            {/* 4. Settings */}
            <button 
              onClick={() => setShowSettings(true)} 
              className="button-secondary header-btn" 
              title="Settings"
            >
              <Settings size={16} />
              <span className="header-btn-label">Settings</span>
            </button>

            {/* 5. About Project - Đặt ở đây (ngay trước Username) */}
            <button
              onClick={() => setShowAbout(true)}
              className="button-secondary header-btn"
              title="About Project"
            >
              <img 
                src="/zerocoder-logo-transparent.png" 
                alt="logo" 
                className="about-btn-logo" 
                style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0 }} 
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
                                 currentUser.colorCode === 'Blue' ? '#3b82f6' : 
                                 currentUser.colorCode === 'Gray' ? '#9ca3af' : 'var(--error)' 
              }} />
              <div style={{ 
                fontSize: '0.75rem', 
                lineHeight: 1,
                color: currentUser.colorCode === 'Green' ? '#10b981' : 
                       currentUser.colorCode === 'Blue' ? '#3b82f6' : 
                       currentUser.colorCode === 'Gray' ? '#9ca3af' : 'var(--text-secondary)',
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

      {showAdminPanel && <AdminPanel onClose={handleCloseAdminPanel} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      {showUserNotif && <UserNotificationModal onClose={() => setShowUserNotif(false)} notifications={userNotifications} />}
    </header>
  );
}
