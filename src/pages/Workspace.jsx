import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CodeEditor } from '../components/CodeEditor';
import { TerminalOutput } from '../components/TerminalOutput';
import { ProblemDescription } from '../components/ProblemDescription';
import { TestResults } from '../components/TestResults';
import FeedbackWidget from '../components/FeedbackWidget';
import { AIAssistant } from '../components/AIAssistant';
import { askAIForHelp } from '../config/aiService';
import { usePython } from '../hooks/usePython';
import { useProblems } from '../context/ProblemsContext';
import { Play, CheckCircle, ArrowLeft, Trophy, Loader2, RotateCcw, LogOut, Zap, ChevronLeft, ChevronRight, Flag, Settings, Info, FileCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SettingsModal } from '../components/SettingsModal';
import { AboutModal } from '../components/AboutModal';
import { CheatsheetModal } from '../components/CheatsheetModal';
import { useNotification } from '../context/NotificationContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../index.css';

export function Workspace() {
  const { id } = useParams();
  const { problems, isLoading, isFetching } = useProblems();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { showConfirm, showToast } = useNotification();
  
  // Find problem based on URL param
  const currentProblem = useMemo(() => {
    return problems.find(p => p.id === id || p.id === Number(id));
  }, [id, problems]);

  const currentTerm = useMemo(() => {
    if (!currentProblem) return 'mid';
    const cat = (currentProblem.category || '').toLowerCase();
    if (cat.includes('final') || cat.includes('last')) return 'final';
    return 'mid';
  }, [currentProblem]);

  const orderedProblems = useMemo(() => {
    if (!problems || problems.length === 0) return [];
    
    const cats = {};
    for (const p of problems) {
      const catLower = (p.category || '').toLowerCase();
      const isMid = p.category === 'FTDS coding practice' || catLower.includes('mid') || catLower.includes('mock');
      const isFinal = p.category === 'FTDS coding practice' || catLower.includes('final') || catLower.includes('last');

      if (currentTerm === 'mid' && !isMid) continue;
      if (currentTerm === 'final' && !isFinal) continue;
      
      let catName = p.category;
      if (catName === 'FTDS coding practice' || catName === 'Mid-term practice') {
        catName = "Coding practice";
      }
      if (!cats[catName]) cats[catName] = [];
      cats[catName].push(p);
    }
    
    const result = [];
    for (const key of Object.keys(cats)) {
      if (key !== "Coding practice") {
        result.push(...cats[key]);
      }
    }
    if (cats["Coding practice"]) {
      result.push(...cats["Coding practice"]);
    }
    
    return result;
  }, [problems, currentTerm]);

  const currentIndex = useMemo(() => {
    return orderedProblems.findIndex(p => p.id === currentProblem?.id);
  }, [currentProblem, orderedProblems]);

  const prevProblem = currentIndex > 0 ? orderedProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 && currentIndex < orderedProblems.length - 1 ? orderedProblems[currentIndex + 1] : null;

  const [code, setCode] = useState('');
  const [proposedCode, setProposedCode] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showAIInEditor, setShowAIInEditor] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const { isLoaded, output, error, runCode, runTests, clearOutput } = usePython();

  // Initialize code when problem changes
  useEffect(() => {
    // Scroll to top so mobile users see the problem description first
    window.scrollTo(0, 0);
    
    const loadCode = async () => {
      if (currentProblem && currentUser) {
        try {
          const draftRef = doc(db, 'code_drafts', `${currentUser.uid}_${id}`);
          const draftSnap = await getDoc(draftRef);
          if (draftSnap.exists()) {
            setCode(draftSnap.data().code);
          } else {
            setCode(currentProblem.initialCode);
          }
        } catch (err) {
          console.error("Failed to load draft:", err);
          setCode(currentProblem.initialCode);
        }
        setTestResults([]);
        setFailedAttempts(0);
        clearOutput();
        // Set flagged status
        try {
          const flaggedData = JSON.parse(localStorage.getItem('flagged_problems') || '{}');
          setIsFlagged(!!flaggedData[id]);
        } catch (e) {
          console.error(e);
        }
      } else if (!currentProblem && !isLoading && !isFetching) {
        // If problem not found after loading, go to dashboard
        navigate('/');
      }
    };
    loadCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProblem, navigate, currentUser, id, isLoading, isFetching]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const containerWidth = window.innerWidth - sidebarWidth;
        const mouseX = e.clientX - sidebarWidth;
        
        let newWidth = (mouseX / containerWidth) * 100;
        // constrain between 20% and 80%
        newWidth = Math.max(20, Math.min(80, newWidth));
        setEditorWidth(newWidth);
      } else if (isSidebarDragging) {
        let newWidth = e.clientX;
        // constrain between 250px and half screen
        newWidth = Math.max(250, Math.min(window.innerWidth / 2, newWidth));
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsSidebarDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDragging || isSidebarDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isDragging, isSidebarDragging, sidebarWidth]);

  // Auto-save code (debounced)
  useEffect(() => {
    if (currentUser && code && currentProblem && code !== currentProblem.initialCode) {
      const timeoutId = setTimeout(() => {
        const draftRef = doc(db, 'code_drafts', `${currentUser.uid}_${id}`);
        setDoc(draftRef, { code, problemId: id, uid: currentUser.uid }, { merge: true })
          .catch(console.error);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [code, currentUser, id, currentProblem]);

  const handleToggleFlag = () => {
    try {
      const flaggedData = JSON.parse(localStorage.getItem('flagged_problems') || '{}');
      if (isFlagged) {
        delete flaggedData[id];
      } else {
        flaggedData[id] = true;
      }
      localStorage.setItem('flagged_problems', JSON.stringify(flaggedData));
      setIsFlagged(!isFlagged);
    } catch (e) {
      console.error('Failed to toggle flag:', e);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    await runCode(code);
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!currentProblem) return;
    setIsRunning(true);
    setTestResults([]); // clear old results
    const results = await runTests(code, currentProblem.testCases);
    setTestResults(results);
    
    const hasFailure = results.some(r => !r.passed);
    if (hasFailure) {
      setFailedAttempts(prev => prev + 1);
    } else if (results.length > 0) {
      // Perfect score! Save to firestore
      if (currentUser) {
        const progressRef = doc(db, 'user_progress', currentUser.uid);
        setDoc(progressRef, { [currentProblem.id]: true }, { merge: true })
          .catch(console.error);
      }
    }
    
    setIsRunning(false);
  };

  const score = useMemo(() => {
    if (!testResults || testResults.length === 0) return { passed: 0, total: 0 };
    const passedCount = testResults.filter(r => r.passed).length;
    const totalCount = testResults.length;
    return { passed: passedCount, total: totalCount };
  }, [testResults]);

  let scoreClass = 'none';
  if (score && score.total > 0) {
    if (score.passed === score.total) scoreClass = 'perfect';
    else if (score.passed > 0) scoreClass = 'partial';
  }

  if (!currentProblem) {
    if (isLoading || isFetching) {
      return (
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Loader2 className="spin" size={32} color="var(--accent-primary)" />
        </div>
      );
    }
    return null;
  }



  return (
    <div className="app-container">
      <header className="header">
        <div className="workspace-header-top" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" state={{ returnToId: currentProblem?.id }} className="button-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0, textDecoration: 'none' }} title="Back to Dashboard">
            <ArrowLeft size={16} />
          </Link>
        </div>
        
        {score.total > 0 && (
          <div className={`score-display ${scoreClass}`}>
            <Trophy size={14} />
            {score.passed} / {score.total} Passed
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem', paddingRight: '1rem', borderRight: '1px solid var(--border-color)' }}>
            {prevProblem ? (
              <Link to={`/workspace/${prevProblem.id}`} className="button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', textDecoration: 'none', fontSize: '0.85rem' }} title="Previous Problem">
                <ChevronLeft size={16} />
                <span className="hide-on-mobile">Prev</span>
              </Link>
            ) : (
              <div style={{ width: '74px' }} className="hide-on-mobile"></div>
            )}
            {nextProblem ? (
              <Link to={`/workspace/${nextProblem.id}`} className="button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap' }} title="Next Problem">
                <span className="hide-on-mobile">
                  {nextProblem.category !== currentProblem.category ? `Next: ${nextProblem.category}` : 'Next'}
                </span>
                <ChevronRight size={16} />
              </Link>
            ) : (
              <Link to="/" state={{ returnToId: currentProblem?.id }} className="button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap' }} title="Finish and go back">
                <span className="hide-on-mobile">Finish</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
          
          <button 
            className="button-secondary"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              color: isFlagged ? '#fbbf24' : 'inherit',
              borderColor: isFlagged ? 'rgba(251, 191, 36, 0.5)' : 'inherit',
              backgroundColor: isFlagged ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
            }}
            onClick={handleToggleFlag}
            title={isFlagged ? "Unflag Problem" : "Flag for Review"}
          >
            <Flag size={16} fill={isFlagged ? '#fbbf24' : 'none'} />
            <span className="hide-on-mobile" style={{ width: '56px', textAlign: 'left' }}>{isFlagged ? 'Flagged' : 'Flag'}</span>
          </button>

          <button 
            className="button-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => {
              showConfirm('Are you sure you want to reset your code? This will erase your current progress.', async () => {
                setCode(currentProblem.initialCode);
                if (currentUser) {
                  const draftRef = doc(db, 'code_drafts', `${currentUser.uid}_${id}`);
                  setDoc(draftRef, { code: currentProblem.initialCode }, { merge: true }).catch(console.error);
                }
                showToast("Code reset to starter template.", "info");
              });
            }}
            title="Reset Code"
          >
            <RotateCcw size={16} />
            <span className="hide-on-mobile">Reset</span>
          </button>
          
          <button 
            className="button-primary"
            onClick={handleRun}
            disabled={!isLoaded || isRunning}
            title="Run Code"
          >
            <Play size={16} />
            <span className="hide-on-mobile">{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button 
            className="button-primary"
            onClick={handleSubmit}
            disabled={!isLoaded || isRunning}
            title="Check Solution"
          >
            <CheckCircle size={16} />
            <span className="hide-on-mobile">Check</span>
          </button>
          
          {!showAIInEditor && (
            <button 
              className="button-ai" 
              onClick={() => setShowAIInEditor(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              title="Ask AI"
            >
              <div style={{ 
                width: 20, 
                height: 20, 
                backgroundColor: 'currentColor', 
                maskImage: 'url(/zerocoder-logo.png)', 
                maskSize: 'contain', 
                maskRepeat: 'no-repeat', 
                maskPosition: 'center',
                WebkitMaskImage: 'url(/zerocoder-logo.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center'
              }} />
              <span className="hide-on-mobile">Ask AI</span>
            </button>
          )}
          
          {currentUser && (
            <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setShowCheatsheet(true)} 
                className="button-secondary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', padding: '0 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', gap: '0.35rem' }} 
                title="Python Cheatsheet"
              >
                <FileCode size={15} />
                <span>Cheatsheet</span>
              </button>
              <FeedbackWidget iconOnly={true} />
              <button onClick={() => setShowSettings(true)} className="button-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0, borderRadius: '9999px' }} title="Settings">
                <Settings size={16} />
              </button>
              <button
                onClick={() => setShowAbout(true)}
                className="button-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0, borderRadius: '9999px' }}
                title="About Project"
              >
                <img 
                  src="/zerocoder-logo-transparent.png" 
                  alt="logo" 
                  className="about-btn-logo" 
                  style={{ width: '18px', height: '18px', objectFit: 'contain' }} 
                />
              </button>

              <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }} />

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
                  {currentUser.colorCode}
                </div>
              </div>

              <button onClick={logout} className="button-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0 }} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar glass-panel" style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>
          <ProblemDescription problem={currentProblem} failedAttempts={failedAttempts} userCode={code} testResults={testResults} />
          <TestResults results={testResults} />
        </aside>
        
        {/* Sidebar Drag Handle */}
        <div 
          className="drag-handle"
          onMouseDown={() => setIsSidebarDragging(true)}
          style={{
            width: '4px',
            cursor: 'col-resize',
            backgroundColor: isSidebarDragging ? 'var(--accent-primary)' : 'var(--border-color)',
            transition: 'background-color 0.2s',
            zIndex: 10,
            margin: '0 -2px',
            position: 'relative'
          }}
        />
        
        <div className="workspace" style={{ flexDirection: 'row', flex: 1, minWidth: 0 }}>
          
          {/* Left Panel: Editor + Terminal */}
          <div style={{ 
            width: showAIInEditor ? `${editorWidth}%` : '100%', 
            height: '100%',
            display: 'grid', 
            gridTemplateRows: '1fr 110px',
            flexShrink: 0, 
            overflow: 'hidden' 
          }}>
            <div className="editor-section" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>main.py</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {proposedCode !== null && (
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#3b82f6', marginRight: '0.25rem' }}>Reviewing AI Fix</span>
                      <button 
                        className="button-primary" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', minHeight: 0 }}
                        onClick={() => { setCode(proposedCode); setProposedCode(null); }}
                      >
                        Accept
                      </button>
                      <button 
                        className="button-secondary" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', minHeight: 0 }}
                        onClick={() => setProposedCode(null)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Ask AI button was moved to the top header */}
                  </div>
                </div>
              </div>
              
              <div style={{ flex: '1', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <CodeEditor 
                  value={proposedCode !== null ? proposedCode : code} 
                  originalCode={proposedCode !== null ? code : undefined}
                  onChange={(val) => {
                    if (proposedCode !== null) {
                      setProposedCode(val);
                    } else {
                      setCode(val);
                    }
                  }} 
                />
              </div>
            </div>
            
            <TerminalOutput output={output} isLoaded={isLoaded} error={error} />
          </div>
          
          {/* Right Panel: AI Assistant */}
          {showAIInEditor && (
            <>
              <style>{`
                @media (max-width: 768px) {
                  .mobile-hidden-drag { display: none !important; }
                }
              `}</style>
              <div 
                className="drag-handle mobile-hidden-drag"
                onMouseDown={() => setIsDragging(true)}
                style={{
                  width: '4px',
                  cursor: 'col-resize',
                  backgroundColor: isDragging ? 'var(--accent-primary)' : 'var(--border-color)',
                  transition: 'background-color 0.2s',
                  zIndex: 10,
                  margin: '0 -2px',
                  position: 'relative'
                }}
              />
            </>
          )}
          <div style={{ 
            display: showAIInEditor ? 'flex' : 'none',
            flex: '1', 
            overflow: 'hidden', 
            flexDirection: 'column' 
          }}>
            <AIAssistant 
              key={currentProblem?.id || 'ai-assistant'}
              problem={currentProblem} 
              userCode={code} 
              testResults={testResults} 
              onClose={() => setShowAIInEditor(false)}
              onProposeFix={setProposedCode}
            />
          </div>

        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <CheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
        mode="master"
        term={currentTerm === 'final' ? 'last' : 'mid'}
      />
    </div>
  );
}
