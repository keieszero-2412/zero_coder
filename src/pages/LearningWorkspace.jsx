import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { NotebookViewer } from '../components/NotebookViewer';
import { LearningAIChat } from '../components/LearningAIChat';
import { FileBrowser } from '../components/FileBrowser';
import { ArrowLeft, ChevronRight, Folder, X, Play, Loader2, ChevronLeft, Compass } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { preprocessMarkdown } from '../utils/latexHelper';
import { CheatsheetModal } from '../components/CheatsheetModal';
import { getLecturesManifest, getCachedLecturesManifest } from '../utils/lecturesCache';

export function LearningWorkspace() {
  const { lectureId, notebookId } = useParams();
  const navigate = useNavigate();
  
  const [manifest, setManifest] = useState(getCachedLecturesManifest);
  const [loading, setLoading] = useState(!getCachedLecturesManifest());
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getLecturesManifest()
      .then(data => {
        if (isMounted) {
          setManifest(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const flattenedNotebooks = useMemo(() => {
    if (!manifest?.lectures) return [];
    const arr = [];
    manifest.lectures.forEach(lecture => {
      lecture.notebooks.forEach(notebook => {
        arr.push({
          lectureId: lecture.id,
          lectureTitle: lecture.title,
          notebookId: notebook.id,
          notebookTitle: notebook.title,
          file: notebook.file,
          datasetsDir: lecture.datasetsDir,
          datasetFiles: lecture.datasetFiles || [],
          guide: notebook.guide || null
        });
      });
    });
    return arr;
  }, [manifest]);

  const currentNotebookIndex = useMemo(() => {
    if (!flattenedNotebooks.length || !lectureId || !notebookId) return -1;
    return flattenedNotebooks.findIndex(n => n.lectureId === lectureId && n.notebookId === notebookId);
  }, [flattenedNotebooks, lectureId, notebookId]);

  const currentNotebookItem = useMemo(() => {
    if (currentNotebookIndex >= 0) return flattenedNotebooks[currentNotebookIndex];
    return null;
  }, [flattenedNotebooks, currentNotebookIndex]);

  const prevNotebook = currentNotebookIndex > 0 ? flattenedNotebooks[currentNotebookIndex - 1] : null;
  const nextNotebook = currentNotebookIndex >= 0 && currentNotebookIndex < flattenedNotebooks.length - 1 ? flattenedNotebooks[currentNotebookIndex + 1] : null;

  const notebookUrl = currentNotebookItem ? `/lectures/${currentNotebookItem.lectureId}/${currentNotebookItem.file}` : null;
  const datasetsDir = currentNotebookItem?.datasetsDir ? `/lectures/${currentNotebookItem.lectureId}/${currentNotebookItem.datasetsDir}` : null;
  const datasetFiles = currentNotebookItem?.datasetFiles || [];
  const lectureTitle = currentNotebookItem?.lectureTitle || '';
  const notebookTitle = currentNotebookItem?.notebookTitle || '';
  const guideContent = currentNotebookItem?.guide || null;

  const [showAI, setShowAI] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  // Active cell context for AI
  const [activeCellIndex, setActiveCellIndex] = useState(null);
  const [activeCellCode, setActiveCellCode] = useState('');
  const [activeCellOutput, setActiveCellOutput] = useState([]);
  const [isNotebookRunning, setIsNotebookRunning] = useState(false);
  const notebookRef = useRef(null);

  // Reset active cell context and scroll when switching notebooks
  useEffect(() => {
    setActiveCellIndex(null);
    setActiveCellCode('');
    setActiveCellOutput([]);
    window.scrollTo(0, 0);
  }, [lectureId, notebookId]);

  const handleCellSelect = useCallback((index, code, output) => {
    setActiveCellIndex(index);
    setActiveCellCode(code || '');
    setActiveCellOutput(output || []);
  }, []);

  const cleanedGuideContent = useMemo(() => {
    if (!guideContent) return null;
    // Strip redundant leading "### Hướng dẫn bài học" or "### Lesson Guide"
    return guideContent.replace(/^###\s*(Hướng dẫn bài học|Lesson Guide)[^\n]*\n+/i, '').trim();
  }, [guideContent]);

  const guideMarkdownComponents = useMemo(() => ({
    h3: ({ children }) => (
      <div style={{
        fontSize: '0.9rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: '0.85rem 0 0.5rem',
        paddingBottom: '0.35rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}>
        {children}
      </div>
    ),
    p: ({ children }) => {
      const textContent = Array.isArray(children)
        ? children.map(c => (typeof c === 'string' ? c : c?.props?.children || '')).join('')
        : String(children || '');

      if (textContent.includes('💡') || textContent.includes('Mẹo:')) {
        return (
          <div style={{
            margin: '0.85rem 0 0.5rem',
            padding: '0.75rem 0.85rem',
            backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-surface-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.55rem',
          }}>
            <span style={{ fontSize: '1.05rem', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>💡</span>
            <div style={{ flex: 1 }}>{children}</div>
          </div>
        );
      }

      return (
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
          {children}
        </p>
      );
    },
    ol: ({ children }) => (
      <ol style={{
        margin: '0.5rem 0 0.85rem',
        paddingLeft: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
      }}>
        {children}
      </ol>
    ),
    ul: ({ children }) => (
      <ul style={{
        margin: '0.5rem 0 0.85rem',
        paddingLeft: '1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
      }}>
        {children}
      </ul>
    ),
    li: ({ children }) => (
      <li style={{
        fontSize: '0.84rem',
        lineHeight: 1.55,
        color: 'var(--text-secondary)',
        paddingLeft: '0.2rem',
      }}>
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        {children}
      </strong>
    ),
    code: ({ children, ...props }) => (
      <code
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          padding: '0.12rem 0.4rem',
          borderRadius: '0.25rem',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.82em',
          color: 'var(--accent-primary)',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
        {...props}
      >
        {children}
      </code>
    ),
  }), []);

  // Early returns removed; we will render them inside the layout skeleton

  return (
    <div className="workspace" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-base)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 40,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/')}
            className="button-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', padding: 0, border: 'none', cursor: 'pointer' }}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {loading ? 'Loading...' : lectureTitle}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge-practice-pill" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                PRACTICE LAB
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {loading ? 'Please wait...' : notebookTitle}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={showGuide ? 'button-primary' : 'button-secondary'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', padding: '0 0.65rem', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, marginLeft: '0.25rem' }}
            title="Lesson Guide"
          >
            Guide
          </button>
          <button 
            onClick={() => setShowCheatsheet(true)}
            className="button-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', padding: '0 0.65rem', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600 }}
            title={`General syntax cheatsheet (${lectureId})`}
          >
            Cheatsheet
          </button>
          <button 
            onClick={() => setShowFiles(!showFiles)}
            className={showFiles ? 'button-primary' : 'button-secondary'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', padding: 0, border: 'none', cursor: 'pointer' }}
            title="Toggle File Browser"
          >
            <Folder size={16} />
          </button>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem', paddingRight: '1rem', borderRight: '1px solid var(--border-color)' }}>
            {prevNotebook ? (
              <Link 
                to={`/learn/${prevNotebook.lectureId}/${prevNotebook.notebookId}`} 
                className="button-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', textDecoration: 'none', fontSize: '0.85rem' }} 
                title={`Previous: ${prevNotebook.notebookTitle}`}
              >
                <ChevronLeft size={16} />
                <span className="hide-on-mobile">Prev</span>
              </Link>
            ) : (
              <div style={{ width: '74px' }} className="hide-on-mobile"></div>
            )}
            {nextNotebook ? (
              <Link 
                to={`/learn/${nextNotebook.lectureId}/${nextNotebook.notebookId}`} 
                className="button-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap' }} 
                title={`Next: ${nextNotebook.notebookTitle}`}
              >
                <span className="hide-on-mobile">
                  {nextNotebook.lectureId !== lectureId 
                    ? `Next: ${nextNotebook.notebookTitle.includes(':') ? nextNotebook.notebookTitle.split(':')[0] : nextNotebook.lectureTitle.split(' - ')[0]}` 
                    : 'Next'}
                </span>
                <ChevronRight size={16} />
              </Link>
            ) : (
              <Link 
                to="/" 
                className="button-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap' }} 
                title="Finish and go back"
              >
                <span className="hide-on-mobile">Finish</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>

          <button
            onClick={() => notebookRef.current?.runAll()}
            disabled={isNotebookRunning || loading}
            className="button-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: (isNotebookRunning || loading) ? 'not-allowed' : 'pointer',
            }}
            title="Run all code cells in this notebook"
          >
            {isNotebookRunning ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <Play size={13} fill="currentColor" />
            )}
            <span className="hide-on-mobile">Run All</span>
          </button>

          <button
            onClick={() => setShowAI(!showAI)}
            className="button-ai"
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
        </div>
      </div>
      
      {/* Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* File Browser Panel */}
        {showFiles && (
          <div style={{ width: '260px', minWidth: '240px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
            <FileBrowser lectureId={lectureId} datasetFiles={datasetFiles} />
          </div>
        )}

        {/* Guide Panel */}
        {showGuide && (
          <div style={{ width: '330px', minWidth: '290px', maxWidth: '380px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.75rem 1.15rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Lesson Guide
              </h3>
              <button 
                onClick={() => setShowGuide(false)} 
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', padding: '0.25rem', borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                title="Close Guide"
              >
                <X size={16} />
              </button>
            </div>
            <div className="markdown-content" style={{ padding: '1.15rem 1.25rem', overflowY: 'auto', flex: 1, fontSize: '0.86rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
              {cleanedGuideContent ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]} 
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={guideMarkdownComponents}
                >
                  {preprocessMarkdown(cleanedGuideContent)}
                </ReactMarkdown>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '1rem', color: 'var(--text-tertiary)' }}>
                  <Compass size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>No additional guide available for this lesson.</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Notebook Content - Full width when panels closed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <h2>{error}</h2>
              <button onClick={() => navigate('/')} className="button-primary" style={{ marginTop: '1rem' }}>
                Back to Dashboard
              </button>
            </div>
          ) : !currentNotebookItem ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <h2>Notebook not found</h2>
              <button onClick={() => navigate('/')} className="button-primary" style={{ marginTop: '1rem' }}>
                Back to Dashboard
              </button>
            </div>
          ) : notebookUrl ? (
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <NotebookViewer
                key={notebookUrl}
                ref={notebookRef}
                notebookUrl={notebookUrl}
                datasetsDir={datasetsDir}
                datasetFiles={datasetFiles.map(file => `/lectures/${currentNotebookItem?.lectureId || lectureId}/${file}`)}
                onCellSelect={handleCellSelect}
                onRunningChange={setIsNotebookRunning}
              />
            </div>
          ) : null}
        </div>

        {/* AI Chat Panel */}
        {showAI && (
          <LearningAIChat
            isOpen={showAI}
            onClose={() => setShowAI(false)}
            notebookTitle={notebookTitle}
            activeCellCode={activeCellCode}
            activeCellOutput={activeCellOutput}
            activeCellIndex={activeCellIndex}
          />
        )}
      </div>

      {/* Lecture Cheatsheet Modal (Single Mode) */}
      <CheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
        mode="single"
        initialLectureId={currentNotebookItem?.lectureId || lectureId}
      />
    </div>
  );
}
