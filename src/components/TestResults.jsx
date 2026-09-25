import { useState } from 'react';
import { CheckCircle2, XCircle, Activity, ChevronDown, ChevronRight } from 'lucide-react';

function TestCaseResult({ res, index }) {
  const [showDiff, setShowDiff] = useState(false);

  const isMCQ = res.isMCQ || (typeof res.code === 'string' && (res.code.startsWith('Câu') || res.code.startsWith('Question')));
  const expStr = String(res.expected ?? '');
  const gotStr = String(res.got ?? '');

  return (
    <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {/* Test Case Header */}
      <div className={`test-case ${res.passed ? 'pass' : 'fail'}`} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
          {res.passed ? (
            <CheckCircle2 color="var(--success)" size={18} style={{ flexShrink: 0 }} />
          ) : (
            <XCircle color="var(--error)" size={18} style={{ flexShrink: 0 }} />
          )}
          <span 
            style={{ 
              fontWeight: 600, 
              fontFamily: 'monospace', 
              fontSize: '0.84rem', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              color: 'var(--text-primary)'
            }} 
            title={res.code ? res.code : `Test Case ${index + 1}`}
          >
            {res.code ? res.code : `Test Case ${index + 1}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span className={`badge ${res.passed ? 'pass' : 'fail'}`} style={{ whiteSpace: 'nowrap' }}>
            {res.passed ? 'Passed' : 'Failed'}
          </span>
        </div>
      </div>
      
      {/* Execution Error */}
      {!res.passed && res.error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid var(--error)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.84rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {expStr && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Expected
              </span>
              <div style={{ 
                fontFamily: 'monospace', 
                backgroundColor: 'color-mix(in srgb, var(--success) 8%, var(--bg-base))', 
                color: 'var(--text-primary)', 
                padding: '0.45rem 0.65rem', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap'
              }}>
                {expStr}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Execution Error
            </span>
            <div style={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'color-mix(in srgb, var(--error) 8%, var(--bg-base))', 
              color: 'var(--error)', 
              padding: '0.45rem 0.65rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.4
            }}>
              {res.error}
            </div>
          </div>
        </div>
      )}

      {/* Output Mismatch */}
      {!res.passed && !res.error && res.got !== undefined && (
        <div style={{ 
          padding: '0.85rem 1rem', 
          backgroundColor: 'var(--bg-surface-elevated)', 
          borderLeft: '3px solid var(--error)', 
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', 
          fontSize: '0.84rem', 
          marginTop: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          {/* Expected */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Expected
            </span>
            <div style={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'color-mix(in srgb, var(--success) 8%, var(--bg-base))', 
              color: 'var(--text-primary)', 
              padding: '0.45rem 0.65rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap'
            }}>
              {expStr}
            </div>
          </div>

          {/* Got */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Your Output (Got)
            </span>
            <div style={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'color-mix(in srgb, var(--error) 8%, var(--bg-base))', 
              color: 'var(--text-primary)', 
              padding: '0.45rem 0.65rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap'
            }}>
              {gotStr}
            </div>
          </div>

          {!isMCQ && (
            <div>
              <button 
                style={{ 
                  padding: '0.25rem 0.6rem', 
                  fontSize: '0.75rem', 
                  backgroundColor: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onClick={() => setShowDiff(!showDiff)}
              >
                {showDiff ? 'Hide differences' : 'Show differences'}
              </button>
              
              {showDiff && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.65rem 0.75rem', 
                  backgroundColor: 'var(--bg-base)', 
                  fontFamily: 'monospace', 
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ color: 'var(--success)', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                    <span style={{ userSelect: 'none', marginRight: '0.5rem', fontWeight: 700 }}>+</span>
                    {expStr}
                  </div>
                  <div style={{ color: 'var(--error)', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                    <span style={{ userSelect: 'none', marginRight: '0.5rem', fontWeight: 700 }}>-</span>
                    {gotStr}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success */}
      {res.passed && (
        <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--success)', borderLeft: '3px solid var(--success)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.82rem', marginTop: '0.25rem' }}>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            <span style={{ color: 'var(--text-tertiary)', marginRight: '0.5rem' }}>Output:</span>
            {gotStr}
          </div>
        </div>
      )}
    </div>
  );
}

export function TestResults({ results, onReset }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="test-results glass-panel">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', backgroundColor: 'transparent', padding: '0', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Activity size={18} color="var(--accent-secondary)" />
          <span style={{ color: 'var(--text-primary)', fontSize: '1rem', marginLeft: '0.5rem' }}>Test Results</span>
        </div>
        <button
          onClick={() => onReset && onReset()}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Reset All
        </button>
      </div>
      
      <div>
        {results.map((res, i) => (
          <TestCaseResult key={i} res={res} index={i} />
        ))}
      </div>
    </div>
  );
}
