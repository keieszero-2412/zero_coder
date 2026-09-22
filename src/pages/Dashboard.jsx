import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProblems } from '../context/ProblemsContext';
import { Code2, ChevronRight, Terminal, CheckCircle, Circle, LogOut, User, Bell, Flag, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminPanel } from '../components/AdminPanel';
import FeedbackWidget from '../components/FeedbackWidget';
import { SettingsModal } from '../components/SettingsModal';
import { CheatsheetModal } from '../components/CheatsheetModal';
import '../index.css';
import { useTerm } from '../context/TermContext';
import { getLecturesManifest, getCachedLecturesManifest } from '../utils/lecturesCache';

export function Dashboard() {
  const { activeTerm } = useTerm();
  const [completedProblems, setCompletedProblems] = useState({});
  const [flaggedProblems, setFlaggedProblems] = useState({});
  const { currentUser, logout } = useAuth();
  const { problems, isLoading } = useProblems();
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
  
  const [lecturesManifest, setLecturesManifest] = useState(() => getCachedLecturesManifest()?.lectures || null);
  
  useEffect(() => {
    getLecturesManifest()
      .then(data => setLecturesManifest(data.lectures))
      .catch(err => console.error("Failed to load lectures:", err));
  }, []);
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [pendingResetCount, setPendingResetCount] = useState(0);
  const [cheatsheetState, setCheatsheetState] = useState({ 
    isOpen: false, 
    mode: 'master', 
    lectureId: activeTerm === 'mid' ? 'Topic1' : 'Lecture5',
    term: activeTerm
  });

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
      const isLastTerm = p.category === "Last-term practice";
      if (activeTerm === 'mid' && isLastTerm) continue;
      if (activeTerm === 'last' && !isLastTerm) continue;

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
  }, [activeTerm, problems]);

  return (
    <div className="app-container" style={{ height: 'auto', overflow: 'visible' }}>


      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <main className="dashboard-main">
        {(isLoading && problems.length === 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
            <div className="loading-spinner" style={{ marginBottom: '1rem', width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading problems...</p>
          </div>
        ) : (
          <>

        {activeTerm === 'last' && (
          <div style={{ marginBottom: '4rem' }}>
            <h1 style={{ marginBottom: '0.75rem', marginTop: '1.5rem', fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Interactive Learning
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.125rem', maxWidth: '800px' }}>
              Explore interactive hands-on lessons via Jupyter Notebooks and reference the general syntax guide.
            </p>

            {/* Cheatsheet Card */}
            <div className="master-cheatsheet-card">
              <div className="master-cheatsheet-content">
                <div className="master-cheatsheet-badges">
                  <span className="badge-master-tag">
                    CHEATSHEET
                  </span>
                  <span className="badge-master-sub">
                    LAST-TERM
                  </span>
                </div>
                <h2 className="master-cheatsheet-title">
                  Data Science Cheatsheet
                </h2>
                <p className="master-cheatsheet-desc">
                  Quick reference for Pandas, NumPy, SQL, data cleaning, visualization, and ML models.
                </p>
                <div className="master-cheatsheet-features">
                  <span className="feature-pill">Data I/O</span>
                  <span className="feature-pill">SQL & REST API</span>
                  <span className="feature-pill">Data Wrangling</span>
                  <span className="feature-pill">Matplotlib & Seaborn</span>
                  <span className="feature-pill">Machine Learning</span>
                </div>
              </div>
              <div className="master-cheatsheet-action">
                <button
                  onClick={() => setCheatsheetState({ isOpen: true, mode: 'master', lectureId: 'Lecture5', term: 'last' })}
                  className="button-primary master-open-btn"
                >
                  <span>Open Cheatsheet</span>
                </button>
                <span className="master-cheatsheet-subnote">
                  Organized by category
                </span>
              </div>
            </div>

            {/* Danh sách các bài giảng (Lecture Cards) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2rem' }}>
              {lecturesManifest ? lecturesManifest.map(lecture => (
                <div key={lecture.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
                  {/* Decorative accent */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--accent-primary)', opacity: 0.8 }}></div>
                  
                  <h3 style={{ fontSize: '1.45rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {lecture.title}
                  </h3>
                  
                  {lecture.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                      {lecture.description}
                    </p>
                  )}
                  
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0 -2rem 1.25rem -2rem' }}></div>
                  
                  {/* Subheader: Practice Labs list + Single Lecture Cheatsheet button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Terminal size={15} color="var(--accent-primary)" />
                      <span>Practice Labs</span>
                    </h4>
                    {/* Loại 2: Cheatsheet riêng từng lecture */}
                    <button
                      onClick={() => setCheatsheetState({ isOpen: true, mode: 'single', lectureId: lecture.id, term: 'last' })}
                      className="lecture-cheatsheet-btn"
                      title={`View general syntax cheatsheet for ${lecture.title}`}
                    >
                      <span>Cheatsheet {lecture.id.replace('Lecture', 'Lec ')}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, margin: '0 -2rem' }}>
                    {lecture.notebooks.map((notebook, index) => (
                      <Link 
                        key={notebook.id} 
                        to={`/learn/${lecture.id}/${notebook.id}`}
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          padding: '1rem 2rem', 
                          textDecoration: 'none', 
                          backgroundColor: 'transparent', 
                          borderBottom: index === lecture.notebooks.length - 1 ? 'none' : '1px solid var(--border-color)', 
                          transition: 'all 0.2s ease', 
                          position: 'relative',
                          borderLeft: '3px solid transparent'
                        }}
                        onMouseOver={(e) => { 
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; 
                          e.currentTarget.style.borderLeftColor = 'var(--accent-primary)'; 
                        }}
                        onMouseOut={(e) => { 
                          e.currentTarget.style.backgroundColor = 'transparent'; 
                          e.currentTarget.style.borderLeftColor = 'transparent'; 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', marginBottom: notebook.description ? '0.35rem' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge-practice-pill">
                              PRACTICE LAB
                            </span>
                            <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'normal', textAlign: 'left', wordBreak: 'break-word', transition: 'color 0.2s ease' }} className="notebook-title">
                              {notebook.title}
                            </span>
                          </div>
                          <ChevronRight size={16} color="var(--text-tertiary)" style={{ flexShrink: 0, marginLeft: '0.75rem', marginTop: '0.2rem', transition: 'transform 0.2s ease, color 0.2s ease' }} className="notebook-arrow" />
                        </div>
                        {notebook.description && (
                          <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, whiteSpace: 'normal', textAlign: 'left', wordBreak: 'break-word', display: 'block', width: '100%' }}>
                            {notebook.description}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  Loading interactive lectures...
                </div>
              )}
            </div>
            
            <div style={{ height: '2px', backgroundColor: 'var(--border-color)', margin: '4rem 0' }}></div>
          </div>
        )}

        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', marginTop: '1rem' }}>Your Exams</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', paddingBottom: '0.5rem', fontSize: '1.125rem', position: 'relative', zIndex: 1 }}>
          Select a problem to start coding. Your progress is automatically saved.
        </p>

        {/* Cheatsheet for Mid-term */}
        {activeTerm === 'mid' && (
          <div className="master-cheatsheet-card" style={{ marginBottom: '2.5rem' }}>
            <div className="master-cheatsheet-content">
              <div className="master-cheatsheet-badges">
                <span className="badge-master-tag">
                  CHEATSHEET
                </span>
                <span className="badge-master-sub">
                  MID-TERM
                </span>
              </div>
              <h2 className="master-cheatsheet-title">
                Mid-term Python Cheatsheet
              </h2>
              <p className="master-cheatsheet-desc">
                Quick reference for Python syntax, data structures, strings, and exam algorithms.
              </p>
              <div className="master-cheatsheet-features">
                <span className="feature-pill">Data Types</span>
                <span className="feature-pill">Strings & Slicing</span>
                <span className="feature-pill">Lists & Comprehensions</span>
                <span className="feature-pill">Tuples, Sets & Dicts</span>
                <span className="feature-pill">Functions & Lambda</span>
                <span className="feature-pill">Math & Algorithms</span>
              </div>
            </div>
            <div className="master-cheatsheet-action">
              <button
                onClick={() => setCheatsheetState({ isOpen: true, mode: 'master', lectureId: 'Topic1', term: 'mid' })}
                className="button-primary master-open-btn"
              >
                <span>Open Cheatsheet</span>
              </button>
              <span className="master-cheatsheet-subnote">
                Organized by category
              </span>
            </div>
          </div>
        )}

        <div className="category-nav-container" style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 40, 
          backgroundColor: 'var(--bg-base)', 
          margin: 0,
          padding: '0.75rem 0',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
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
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
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
            style={{ marginBottom: '4rem', scrollMarginTop: '70px' }}
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
                    <Link to={`/workspace/${problem.id}`} key={problem.id} id={`problem-${problem.id}`} className="problem-list-item glass-panel">
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
          </>
        )}
      </main>

      <CheatsheetModal 
        isOpen={cheatsheetState.isOpen} 
        onClose={() => setCheatsheetState(prev => ({ ...prev, isOpen: false }))} 
        mode={cheatsheetState.mode}
        initialLectureId={cheatsheetState.lectureId} 
        term={cheatsheetState.term || activeTerm}
      />
    </div>
  );
}
