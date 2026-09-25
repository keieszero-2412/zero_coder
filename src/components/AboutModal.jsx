import { X } from 'lucide-react';

export function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel smooth-scroll" style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--bg-surface)',
          zIndex: 10
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            About Zero Coder
          </h2>
          <button onClick={onClose} className="button-secondary" style={{ padding: '0.5rem' }} title="Close">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          <p style={{ fontSize: '1.125rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            <strong>Zero Coder</strong> is a web-based Python execution and learning platform designed to help students practice programming and data analysis. The system provides automated grading and integrates a multi-provider AI assistant for error analysis and code optimization.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>WebAssembly Compiler</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                Run Python code directly via Web Worker (Pyodide) without local setup. Pre-loaded with powerful Data Science libraries like Pandas and NumPy.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Multi-Model AI</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                "Zero" AI assistant with fallback mechanism across top models (Gemini, Groq, Mistral, OpenRouter) for grading, debugging, and auto-diff code review.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Interactive Learning</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                Experience interactive Jupyter Notebook lectures. Features real-time Markdown rendering and accurate math formulas (KaTeX).
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Premium UI</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                Modern Glassmorphism aesthetics with 6 synchronized color themes. Perfectly responsive across devices with Vim Mode support for power users.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Quick Guide
            </h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.25rem' }}>
              <li><strong>Workspace:</strong> Select a problem to start. Code on the left, view test results and chat with AI on the right.</li>
              <li><strong>Learning:</strong> Navigate to Interactive Learning and click <em>Run</em> on code cells to practice theory instantly.</li>
              <li><strong>Customization:</strong> Open Settings to toggle Vim Mode or switch between 6 premium themes.</li>
              <li><strong>Note:</strong> Code execution is 100% offline (WASM). The AI assistant requires a stable internet connection. Progress saves automatically.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>GitHub</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="https://github.com/keieszero-2412/zero_coder"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.5rem', justifyContent: 'center'
                }}
              >
                Source Code
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
