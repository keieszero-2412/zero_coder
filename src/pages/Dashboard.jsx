import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problems } from '../data/problems';
import { Code2, ChevronRight, BookOpen, CheckCircle, Circle, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../index.css';

export function Dashboard() {
  const [completedProblems, setCompletedProblems] = useState({});
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    try {
      if (currentUser) {
        const saved = localStorage.getItem(`zerocoder_progress_${currentUser.email}`);
        if (saved) {
          setCompletedProblems(JSON.parse(saved));
        } else {
          setCompletedProblems({});
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const categories = useMemo(() => {
    const cats = {};
    for (const p of problems) {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    }
    // Add empty placeholder for "Coding practice" if it doesn't exist
    if (!cats["Coding practice"]) {
      cats["Coding practice"] = [];
    }
    return cats;
  }, []);

  return (
    <div className="app-container" style={{ overflow: 'auto' }}>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-title" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
          <img 
            src="/zerocoder-logo.png" 
            alt="zerocoder Logo" 
            style={{ 
              width: '52px', 
              height: '52px', 
              objectFit: 'contain', 
              marginRight: '0.5rem'
            }} 
          />
          zerocoder
        </div>
        
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{currentUser.username}</span>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem', 
                fontSize: '0.75rem', 
                color: currentUser.colorCode === 'Green' ? 'var(--accent-primary)' : 'var(--text-secondary)'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: currentUser.colorCode === 'Green' ? 'var(--accent-primary)' : 
                                   currentUser.colorCode === 'Blue' ? '#3b82f6' : 'var(--error)' 
                }} />
                Code: {currentUser.colorCode}
              </div>
            </div>
            
            <button onClick={logout} className="button-secondary" style={{ padding: '0.5rem 0.75rem' }} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </header>

      <main style={{ padding: '3rem 2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>Your Exams</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.125rem' }}>
          Select a problem to start coding. Your progress is automatically saved.
        </p>

        {Object.entries(categories).map(([category, items]) => (
          <div key={category} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', marginBottom: '4rem', alignItems: 'start' }}>
            <div style={{ position: 'sticky', top: '100px' }}>
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
                    <Link to={`/exam/${problem.id}`} key={problem.id} className="problem-list-item glass-panel">
                      <div className="problem-list-icon">
                        {isCompleted ? (
                          <CheckCircle size={20} color="var(--accent-primary)" />
                        ) : (
                          <Circle size={20} color="var(--text-tertiary)" />
                        )}
                      </div>
                      <div className="problem-list-content">
                        <h3 className="problem-list-title">{problem.title}</h3>
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
