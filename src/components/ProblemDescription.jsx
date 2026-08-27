import { BookOpen, Lightbulb } from 'lucide-react';
import { AIAssistant } from './AIAssistant';

export function ProblemDescription({ problem, failedAttempts = 0, userCode, testResults }) {
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

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 'var(--radius-md)', color: '#fbbf24' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          <Lightbulb size={18} />
          Gợi ý (Hint)
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
          {problem.hint || "Hãy đọc kỹ lại yêu cầu đề bài, chú ý đến các trường hợp đặc biệt (edge cases), và kiểm tra xem hàm của bạn đã return đúng giá trị yêu cầu (thay vì chỉ dùng lệnh print) hay chưa."}
        </div>
      </div>

      <AIAssistant 
        problem={problem} 
        userCode={userCode} 
        testResults={testResults} 
      />
    </div>
  );
}
