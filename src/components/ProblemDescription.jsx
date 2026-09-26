import { BookOpen, Lightbulb, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { formatProblemDescription } from '../utils/latexHelper';

function ProblemCodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && (match || String(children).includes('\n'))) {
    return (
      <div style={{ margin: '1rem 0 1.25rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-elevated)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-highlight)', padding: '0.4rem 0.85rem', fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{lang || 'CODE'}</span>
          <button 
            onClick={handleCopy} 
            style={{ background: 'none', border: 'none', color: copied ? 'var(--success)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)', transition: 'color 0.2s' }}
            title="Copy code"
          >
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre style={{ margin: 0, padding: '1rem', backgroundColor: 'transparent', overflowX: 'auto' }} {...props}>
          <code className={className} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre', display: 'block' }}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  return <code className={className} {...props}>{children}</code>;
}

export function ProblemDescription({ problem, failedAttempts = 0, userCode, testResults }) {
  const [showHint, setShowHint] = useState(false);

  // Reset hint state when problem changes
  useEffect(() => {
    setShowHint(false);
  }, [problem?.id]);

  const formattedDescription = useMemo(() => {
    return formatProblemDescription(problem?.description || '');
  }, [problem?.description]);

  const formattedHint = useMemo(() => {
    return formatProblemDescription(
      problem?.hint || 
      "Hãy đọc kỹ lại yêu cầu đề bài, chú ý đến các trường hợp đặc biệt (edge cases), và kiểm tra xem hàm của bạn đã return đúng giá trị yêu cầu (thay vì chỉ dùng lệnh print) hay chưa."
    );
  }, [problem?.hint]);

  if (!problem) return null;

  return (
    <div className="problem-container">
      <div className="section-header" style={{ marginBottom: '1rem', backgroundColor: 'transparent', padding: '0', border: 'none' }}>
        <BookOpen size={18} color="var(--accent-primary)" />
        <span style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Problem Description</span>
      </div>

      <h2 className="problem-title">{problem.title}</h2>

      <div className="problem-description-content markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{ code: ProblemCodeBlock }}
        >
          {formattedDescription}
        </ReactMarkdown>
      </div>

      {problem.examples && problem.examples.map((ex, i) => (
        <div key={i} className="example-box">
          <strong>Example {i + 1}:</strong>
          <div style={{ marginTop: '0.5rem' }}>
            <div><strong>Input:</strong> <code>{ex.input}</code></div>
            <div><strong>Output:</strong> <code>{ex.output}</code></div>
            {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '2rem', backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <button 
          onClick={() => setShowHint(!showHint)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={18} color="var(--accent-primary)" />
            Hint
          </div>
          {showHint ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {showHint && (
          <div className="markdown-content" style={{ padding: '1rem', fontSize: '0.95rem', lineHeight: '1.65', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{ code: ProblemCodeBlock }}
            >
              {formattedHint}
            </ReactMarkdown>
          </div>
        )}
      </div>

    </div>
  );
}
