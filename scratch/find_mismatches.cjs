const fs = require('fs');
const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));

for (const p of problems) {
  if (p.type === 'multiple_choice' || !p.testCases) continue;
  const initial = p.initialCode || '';
  const defs = [...initial.matchAll(/def\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);
  
  for (const tc of p.testCases) {
    if (!tc.code) continue;
    const calls = [...tc.code.matchAll(/(?:print\s*\(\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)]
      .map(m => m[1])
      .filter(f => !['print', 'len', 'str', 'int', 'float', 'type', 'list', 'dict', 'set', 'tuple', 'sorted', 'range', 'round', 'sum', 'min', 'max', 'date', 'datetime', 'np', 'pd', 'plt', 'math', 'Counter', 'gcd', 'sqrt', 'points', 'seed'].includes(f));
    
    for (const c of calls) {
      if (!defs.includes(c)) {
        console.log(`[${p.id}] "${p.title}" calls "${c}" but defs are [${defs.join(', ')}]`);
      }
    }
  }
}
