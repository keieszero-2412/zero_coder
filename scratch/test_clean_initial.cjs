const fs = require('fs');
const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));

function cleanInitialCode(code) {
  if (!code || typeof code !== 'string') return code;
  const lines = code.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed === '# Write your code here') return false;
    if (trimmed.startsWith('# Write your code')) return false;
    if (trimmed === 'pass') return false;
    return true;
  });
  return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

['tin314_p1_q5', 'tin314_p1_q10', 'tin314_p2_q1', 'tin314_p2_q3', 'tin314_p2_q10'].forEach(id => {
  const p = problems.find(x => x.id === id);
  console.log(`=== ${id} ===\n${cleanInitialCode(p.initialCode)}\n`);
});
