import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export function MultipleChoiceViewer({ problem, value, onChange }) {
  const answers = useMemo(() => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  }, [value]);

  const handleSelect = (qIndex, optionLetter) => {
    let newAnswers = { ...answers };
    let current = newAnswers[qIndex] || [];
    if (!Array.isArray(current)) current = [current];
    if (current.includes(optionLetter)) {
      current = current.filter(l => l !== optionLetter);
    } else {
      current = [...current, optionLetter].sort();
    }
    if (current.length === 0) delete newAnswers[qIndex];
    else newAnswers[qIndex] = current;
    onChange(JSON.stringify(newAnswers));
  };

  if (!problem || !problem.questions) return null;

  return (
    <div style={{ padding: '2rem', overflowY: 'auto', height: '100%', backgroundColor: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Phần I: Trắc nghiệm</h2>
        {Object.keys(answers).length > 0 && (
          <button
            onClick={() => onChange('{}')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Clear Answers
          </button>
        )}
      </div>
      {problem.questions.map((q, qIndex) => {
        // All questions support multiple selections
        const isMulti = true;
        const selected = answers[qIndex];
        
        return (
          <div key={qIndex} style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeRaw, rehypeKatex]}
              >
                {q.text}
              </ReactMarkdown>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {q.options.map((opt, oIndex) => {
                // Extract letter (A, B, C, D)
                const match = opt.match(/^([A-Z])\./);
                const letter = match ? match[1] : String.fromCharCode(65 + oIndex);
                
                const isSelected = (Array.isArray(selected) && selected.includes(letter)) || selected === letter;
                
                return (
                  <label 
                    key={oIndex} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem', 
                      padding: '0.75rem 1rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      name={`q_${qIndex}`} 
                      value={letter} 
                      checked={isSelected}
                      onChange={() => handleSelect(qIndex, letter)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={{ p: ({node, ...props}) => <span {...props} /> }}
                      >
                        {opt}
                      </ReactMarkdown>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
