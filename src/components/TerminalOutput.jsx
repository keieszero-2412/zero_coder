import { Terminal } from 'lucide-react';
import ImagePreview from './ImagePreview';

export function TerminalOutput({ output, isLoaded, error }) {
  return (
    <div className="terminal-section" style={{ height: '100%', minHeight: '0', flexShrink: 0 }}>
      <div className="section-header">
        <Terminal size={16} />
        <span>Terminal Output</span>
        {!isLoaded && !error && <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>Loading Python Env...</span>}
      </div>
      <div className="terminal-output">
        {error ? (
          <div className="terminal-error">{error}</div>
        ) : output.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No output...</div>
        ) : (
          output.map((line, i) => {
            if (line.type === 'stderr') {
              return <div key={i} className="terminal-error" style={{ whiteSpace: 'pre-wrap' }}>{line.text}</div>;
            }
            // Parse __IMAGE_BASE64__ blocks
            const content = line.text || '';
            if (!content.includes('__IMAGE_BASE64__')) {
              return <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{content}</div>;
            }
            
            const parts = content.split('__IMAGE_BASE64__');
            return (
              <div key={i} style={{ whiteSpace: 'pre-wrap' }}>
                {parts.map((part, idx) => {
                  if (idx === 0) return part; // text before first image
                  if (part.includes('__IMAGE_END__')) {
                    const [base64, rest] = part.split('__IMAGE_END__');
                    return (
                      <span key={idx}>
                        <ImagePreview 
                          src={`data:image/png;base64,${base64.replace(/\s+/g, '')}`} 
                          alt="plot output" 
                        />
                        {rest}
                      </span>
                    );
                  }
                  return '__IMAGE_BASE64__' + part; // malformed output
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
