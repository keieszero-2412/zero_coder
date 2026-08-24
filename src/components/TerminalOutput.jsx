import { Terminal } from 'lucide-react';

export function TerminalOutput({ output, isLoaded, error }) {
  return (
    <div className="terminal-section">
      <div className="section-header">
        <Terminal size={16} />
        <span>Terminal Output</span>
        {!isLoaded && <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>Loading Python Env...</span>}
      </div>
      <div className="terminal-output">
        {error ? (
          <div className="terminal-error">{error}</div>
        ) : output.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No output...</div>
        ) : (
          output.map((line, i) => (
            <div key={i} className={line.type === 'stderr' ? 'terminal-error' : ''} style={{ whiteSpace: 'pre-wrap' }}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
