import { Trophy } from 'lucide-react';

export function ProblemSelector({ problems, currentProblemId, onSelectProblem, score }) {
  
  let scoreClass = 'none';
  if (score && score.total > 0) {
    if (score.passed === score.total) scoreClass = 'perfect';
    else if (score.passed > 0) scoreClass = 'partial';
  }

  return (
    <div className="problem-selector">
      <select 
        className="problem-select-dropdown"
        value={currentProblemId} 
        onChange={(e) => onSelectProblem(Number(e.target.value))}
      >
        {problems.map(p => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      
      {score && score.total > 0 && (
        <div className={`score-display ${scoreClass}`}>
          <Trophy size={14} />
          {score.passed} / {score.total} Passed
        </div>
      )}
    </div>
  );
}
