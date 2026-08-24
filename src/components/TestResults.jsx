import { useState } from 'react';
import { CheckCircle2, XCircle, Activity, ChevronDown, ChevronRight } from 'lucide-react';

function TestCaseResult({ res, index }) {
  const [showDiff, setShowDiff] = useState(false);

  return (
    <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div className={`test-case ${res.passed ? 'pass' : 'fail'}`} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {res.passed ? <CheckCircle2 color="var(--success)" size={20} /> : <XCircle color="var(--error)" size={20} />}
          <span style={{ fontWeight: 500 }}>Test Case {index + 1}</span>
        </div>
        <div className={`badge ${res.passed ? 'pass' : 'fail'}`}>
          {res.passed ? 'Passed' : 'Failed'}
        </div>
      </div>
      
      {/* Execution Error */}
      {!res.passed && res.error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '3px solid var(--error)', borderRadius: '0 4px 4px 0', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          <div style={{ fontFamily: 'monospace', color: 'inherit', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {res.code}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontFamily: 'monospace' }}>
            <div style={{ color: 'var(--success)' }}>Expected: {res.expected}</div>
            <div style={{ color: 'var(--error)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '0.5rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '0.5rem' }}>
              <strong>Execution Error:</strong><br/>
              {res.error}
            </div>
          </div>
        </div>
      )}

      {/* Output Mismatch */}
      {!res.passed && !res.error && res.got !== undefined && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '3px solid var(--error)', borderRadius: '0 4px 4px 0', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            {res.code}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontFamily: 'monospace' }}>
            <div style={{ color: 'var(--success)' }}>Expected: {res.expected}</div>
            <div style={{ color: 'var(--error)' }}>Got: {res.got}</div>
          </div>
          <button 
            className="button-primary"
            style={{ marginTop: '0.75rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            onClick={() => setShowDiff(!showDiff)}
          >
            {showDiff ? 'Hide differences' : 'Show differences'}
          </button>
          
          {showDiff && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', fontFamily: 'monospace', borderRadius: 'var(--radius-sm)' }}>
              <div>
                {res.expected.split('').map((char, i) => (
                  <span key={`exp-${i}`} style={res.got[i] === char ? { color: 'var(--text-tertiary)' } : { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}>
                    {char === ' ' ? '·' : char}
                  </span>
                ))}
              </div>
              <div>
                {res.got.split('').map((char, i) => (
                  <span key={`got-${i}`} style={res.expected[i] === char ? { color: 'var(--text-tertiary)' } : { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}>
                    {char === ' ' ? '·' : char}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success */}
      {res.passed && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderLeft: '3px solid var(--success)', borderRadius: '0 4px 4px 0', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(34, 197, 94, 0.2)' }}>
            {res.code}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontFamily: 'monospace' }}>
            <div style={{ color: 'var(--success)' }}>Expected: {res.expected}</div>
            <div style={{ color: 'var(--success)' }}>Got: {res.expected}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TestResults({ results }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="test-results glass-panel">
      <div className="section-header" style={{ marginBottom: '1rem', backgroundColor: 'transparent', padding: '0', border: 'none' }}>
        <Activity size={18} color="var(--accent-secondary)" />
        <span style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Test Results</span>
      </div>
      
      <div>
        {results.map((res, i) => (
          <TestCaseResult key={i} res={res} index={i} />
        ))}
      </div>
    </div>
  );
}
