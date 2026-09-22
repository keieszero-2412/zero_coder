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
            <strong>ZeroCoder</strong> is an online platform, designed specifically for Foreign Trade University students to review and prepare for their programming course. The system allows students to write and execute Python code directly in the browser and features automated grading for exercises and exams.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Inline Compiler</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                Run Python code directly in the browser using WebAssembly (Pyodide), no environment installation required. Fast, secure, and fully supports Data Science libraries (Pandas, Numpy, Matplotlib...).
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>AI Assistant</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                Integrated with Google Gemini AI to help you analyze code errors, receive optimization suggestions, and evaluate code against Clean Code standards.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Interactive Learning</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                Experience intuitive learning with Jupyter Notebook-style lectures, combining theory and code practice in one interface.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Quick Instructions
            </h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.25rem' }}>
              <li><strong>Workspace:</strong> Choose a problem on the Dashboard to start solving. Use the left window to write code, and the right window to view results and chat with AI.</li>
              <li><strong>Interactive Learning:</strong> Explore the interactive lecture section to learn theory on your own. Click the Run button in each code cell to execute examples.</li>
              <li><strong>Interface:</strong> You can customize the Theme (Light/Dark) in the Settings panel. The system provides 6 different color schemes to enhance your learning experience.</li>
              <li><strong>Note:</strong> Code execution takes place offline, but the AI chat feature requires a stable internet connection. All your progress is automatically saved.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Github</h3>
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
                Source Code (GitHub)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
