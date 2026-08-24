import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CodeEditor } from '../components/CodeEditor';
import { TerminalOutput } from '../components/TerminalOutput';
import { ProblemDescription } from '../components/ProblemDescription';
import { TestResults } from '../components/TestResults';
import { usePython } from '../hooks/usePython';
import { problems } from '../data/problems';
import { Play, CheckCircle, ArrowLeft, Trophy, RotateCcw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../index.css';

export function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  // Find problem based on URL param
  const currentProblem = useMemo(() => {
    return problems.find(p => p.id === id || p.id === Number(id));
  }, [id]);

  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { isLoaded, output, error, runCode, runTests, clearOutput } = usePython();

  // Initialize code when problem changes
  useEffect(() => {
    if (currentProblem && currentUser) {
      const savedCode = localStorage.getItem(`zerocoder_code_${currentUser.email}_${id}`);
      setCode(savedCode !== null ? savedCode : currentProblem.initialCode);
      setTestResults([]);
      setFailedAttempts(0);
      clearOutput();
    } else if (!currentProblem) {
      // If problem not found, go to dashboard
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProblem, navigate, currentUser]);

  // Auto-save code
  useEffect(() => {
    if (currentUser && code && currentProblem && code !== currentProblem.initialCode) {
      localStorage.setItem(`zerocoder_code_${currentUser.email}_${id}`, code);
    }
  }, [code, currentUser, id, currentProblem]);

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
    }
    
    setIsRunning(false);
  };

  const score = useMemo(() => {
    if (!testResults || testResults.length === 0) return { passed: 0, total: 0 };
    const passedCount = testResults.filter(r => r.passed).length;
    const totalCount = testResults.length;
    
    // Save progress to local storage
    if (passedCount === totalCount && totalCount > 0 && currentProblem && currentUser) {
      try {
        const progressKey = `zerocoder_progress_${currentUser.email}`;
        const saved = localStorage.getItem(progressKey);
        const progress = saved ? JSON.parse(saved) : {};
        if (!progress[currentProblem.id]) {
          progress[currentProblem.id] = true;
          localStorage.setItem(progressKey, JSON.stringify(progress));
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    return {
      passed: passedCount,
      total: totalCount
    };
  }, [testResults, currentProblem]);

  let scoreClass = 'none';
  if (score && score.total > 0) {
    if (score.passed === score.total) scoreClass = 'perfect';
    else if (score.passed > 0) scoreClass = 'partial';
  }

  if (!currentProblem) return null;

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="button-primary" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem', border: '1px solid var(--border-color)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="header-title" style={{ fontSize: '1rem' }}>
            {currentProblem.title}
          </div>
        </div>
        
        {score.total > 0 && (
          <div className={`score-display ${scoreClass}`}>
            <Trophy size={14} />
            {score.passed} / {score.total} Passed
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="button-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => {
              if (window.confirm('Are you sure you want to reset your code? This will erase your current progress.')) {
                setCode(currentProblem.initialCode);
                if (currentUser) {
                  localStorage.removeItem(`zerocoder_code_${currentUser.email}_${id}`);
                }
              }
            }}
          >
            <RotateCcw size={16} />
            Reset Code
          </button>
          
          <button 
            className="button-primary" 
            style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            onClick={handleRun}
            disabled={!isLoaded || isRunning}
          >
            <Play size={16} />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>

          <button 
            className="button-primary"
            onClick={handleSubmit}
            disabled={!isLoaded || isRunning}
          >
            <CheckCircle size={16} />
            Submit
          </button>
          
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
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
                  {currentUser.colorCode}
                </div>
              </div>
              <button onClick={logout} className="button-secondary" style={{ padding: '0.5rem' }} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar glass-panel">
          <ProblemDescription problem={currentProblem} failedAttempts={failedAttempts} />
          <TestResults results={testResults} />
        </aside>
        
        <div className="workspace">
          <div className="editor-section">
            <div className="section-header">main.py</div>
            <CodeEditor value={code} onChange={setCode} />
          </div>
          
          <TerminalOutput output={output} isLoaded={isLoaded} error={error} />
        </div>
      </main>
    </div>
  );
}
