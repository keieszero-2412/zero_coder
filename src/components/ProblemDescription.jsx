import { BookOpen, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ProblemDescription({ problem, failedAttempts = 0, userCode, testResults }) {
  const [showHint, setShowHint] = useState(false);

  // Reset hint state when problem changes
  useEffect(() => {
    setShowHint(false);
  }, [problem?.id]);

  if (!problem) return null;

  return (
    <div className="problem-container">
      <div className="section-header" style={{ marginBottom: '1rem', backgroundColor: 'transparent', padding: '0', border: 'none' }}>
        <BookOpen size={18} color="var(--accent-primary)" />
        <span style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Problem Description</span>
      </div>

      <h2 className="problem-title">{problem.title}</h2>

      <div className="problem-description-content" dangerouslySetInnerHTML={{ __html: problem.description }} />

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

      <div style={{ marginTop: '2rem', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 'var(--radius-md)', color: '#fbbf24', overflow: 'hidden' }}>
        <button 
          onClick={() => setShowHint(!showHint)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={18} />
            Gợi ý (Hint)
          </div>
          {showHint ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {showHint && (
          <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {problem.hint || "Hãy đọc kỹ lại yêu cầu đề bài, chú ý đến các trường hợp đặc biệt (edge cases), và kiểm tra xem hàm của bạn đã return đúng giá trị yêu cầu (thay vì chỉ dùng lệnh print) hay chưa."}
          </div>
        )}
      </div>

    </div>
  );
}
