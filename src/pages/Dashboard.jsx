import { useMemo, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { problems } from '../data/problems';
import { Code2, ChevronRight, BookOpen, CheckCircle, Circle, LogOut, User, Bell, Flag, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminPanel } from '../components/AdminPanel';
import FeedbackWidget from '../components/FeedbackWidget';
import { SettingsModal } from '../components/SettingsModal';
import '../index.css';

export function Dashboard() {
  const [completedProblems, setCompletedProblems] = useState({});
  const [flaggedProblems, setFlaggedProblems] = useState({});
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.returnToId) {
      setTimeout(() => {
        const el = document.getElementById(`problem-${location.state.returnToId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight briefly for better UX
          el.style.transition = 'background-color 0.5s ease';
          el.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; // Tailwind blue-500 with opacity
          setTimeout(() => {
            el.style.backgroundColor = '';
          }, 1500);
        }
      }, 100);
    }
    
    // Load flagged problems
    try {
      const flagged = JSON.parse(localStorage.getItem('flagged_problems') || '{}');
      setFlaggedProblems(flagged);
    } catch (e) {
      console.error(e);
    }
  }, [location.state]);

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (currentUser) {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        import('../config/firebase').then(({ db }) => {
          unsubscribe = onSnapshot(doc(db, 'user_progress', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              setCompletedProblems(docSnap.data());
            } else {
              setCompletedProblems({});
            }
          }, (err) => {
            console.error("Failed to listen to progress:", err);
          });
        });
      });
    } else {
      setCompletedProblems({});
    }
    
    return () => unsubscribe();
  }, [currentUser]);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [pendingResetCount, setPendingResetCount] = useState(0);

  useEffect(() => {
    let unsubscribeAccess = () => {};
    let unsubscribeReset = () => {};
    if (currentUser && currentUser.role === 'Admin') {
      import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
        import('../config/firebase').then(({ db }) => {
          const qAccess = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
          unsubscribeAccess = onSnapshot(qAccess, (snapshot) => {
            setPendingAccessCount(snapshot.docs.length);
          }, (err) => {
            console.error("Failed to listen to access requests:", err);
          });
          
          const qReset = query(collection(db, 'password_reset_requests'), where('status', '==', 'pending'));
          unsubscribeReset = onSnapshot(qReset, (snapshot) => {
            setPendingResetCount(snapshot.docs.length);
          }, (err) => {
            console.error("Failed to listen to reset requests:", err);
          });
        });
      });
    }
    return () => {
      unsubscribeAccess();
      unsubscribeReset();
    };
  }, [currentUser]);

  const categories = useMemo(() => {
    const cats = {};
    for (const p of problems) {
      let catName = p.category;
      if (catName === "Mid-term practice") {
        catName = "Coding practice";
      }
      if (!cats[catName]) cats[catName] = [];
      cats[catName].push(p);
    }
    
    const sortedCats = {};
    for (const key of Object.keys(cats)) {
      if (key !== "Coding practice") {
        sortedCats[key] = cats[key];
      }
    }
    if (cats["Coding practice"]) {
      sortedCats["Coding practice"] = cats["Coding practice"];
    }
    
    return sortedCats;
  }, []);

  return (
    <div className="app-container" style={{ overflow: 'auto' }}>
      <header className="header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 90%, transparent)',
        backdropFilter: 'blur(12px)'
      }}>
        <div className="header-title" style={{ fontSize: '1.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <img 
            src="/zerocoder-logo-transparent.png" 
            alt="zerocoder Logo" 
            style={{ 
              width: '36px', 
              height: '36px', 
              objectFit: 'contain', 
              marginRight: '0.5rem',
              marginTop: '2px',
              borderRadius: '8px'
            }} 
          />
          zerocoder
        </div>
        
        {currentUser && (
          <div className="dashboard-user-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '0.375rem', rowGap: '0.125rem', alignItems: 'center' }}>
                <span style={{ gridColumn: 2, fontSize: '0.875rem', fontWeight: 500, lineHeight: 1 }}>
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
                         currentUser.colorCode === 'Blue' ? '#3b82f6' : 'var(--text-secondary)'
                }}>
                  Code: {currentUser.colorCode}
                </div>
              </div>
            
            {currentUser.role === 'Admin' && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="button-secondary"
                style={{ padding: '0.5rem 0.75rem', position: 'relative' }}
                title="Admin Dashboard"
              >
                <Bell size={16} />
                <span className="hide-on-mobile">Admin</span>
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

            <FeedbackWidget />

            <button onClick={() => setShowSettings(true)} className="button-secondary" style={{ padding: '0.5rem 0.75rem' }} title="Settings">
              <Settings size={16} />
              <span className="hide-on-mobile">Settings</span>
            </button>

            <button onClick={logout} className="button-secondary" style={{ padding: '0.5rem 0.75rem' }} title="Sign Out">
              <LogOut size={16} />
              <span className="hide-on-mobile">Logout</span>
            </button>
          </div>
        )}
      </header>

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <main className="dashboard-main">
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', marginTop: '2rem' }}>Your Exams</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 0, paddingBottom: '0.5rem', fontSize: '1.125rem', position: 'relative', zIndex: 1 }}>
          Select a problem to start coding. Your progress is automatically saved.
        </p>

        {/* Sticky Category Navigation - sits below title normally, sticks under header on scroll */}
        <div className="category-nav-container" style={{ 
          position: 'sticky', 
          top: '31px', 
          zIndex: 40, 
          backgroundColor: 'var(--bg-base)', 
          margin: 0,
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {Object.keys(categories).map(cat => (
            <button 
              key={cat} 
              className="button-secondary"
              onClick={() => {
                const el = document.getElementById(`category-${cat.replace(/\s+/g, '-')}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              style={{ 
                whiteSpace: 'nowrap',
                color: 'var(--text-primary)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {Object.entries(categories).map(([category, items]) => (
          <div 
            key={category} 
            id={`category-${category.replace(/\s+/g, '-')}`}
            className="category-section"
            style={{ marginBottom: '4rem', scrollMarginTop: '110px' }}
          >
            <div className="category-header-sticky">
              <h2 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)', borderLeft: '4px solid var(--accent-primary)', paddingLeft: '1rem' }}>
                {category}
              </h2>
            </div>
            
            {items.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                Coming soon...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map((problem) => {
                  const isCompleted = completedProblems[problem.id];
                  return (
                    <Link to={`/exam/${problem.id}`} key={problem.id} id={`problem-${problem.id}`} className="problem-list-item glass-panel">
                      <div className="problem-list-icon">
                        {isCompleted ? (
                          <CheckCircle size={20} color="var(--accent-primary)" />
                        ) : (
                          <Circle size={20} color="var(--text-tertiary)" />
                        )}
                      </div>
                      <div className="problem-list-content">
                        <h3 className="problem-list-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {problem.title}
                          {flaggedProblems[problem.id] && (
                            <Flag size={14} fill="#fbbf24" color="#fbbf24" title="Flagged for review" />
                          )}
                        </h3>
                        <div className="problem-list-desc" dangerouslySetInnerHTML={{ __html: problem.description.substring(0, 80) + '...' }} />
                      </div>
                      <div className="problem-list-action">
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Solve</span>
                        <ChevronRight size={18} color="var(--text-secondary)" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
