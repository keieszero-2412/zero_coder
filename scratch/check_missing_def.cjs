const fs = require('fs');
const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));

const list = [];
for (const p of problems) {
  if (p.type === 'multiple_choice') continue;
  if (!p.testCases || p.testCases.length === 0) continue;

  // Extract function name from testCases
  let fnName = null;
  let sampleCall = null;
  for (const tc of p.testCases) {
    if (!tc.code) continue;
    const m = tc.code.match(/(?:print\s*\(\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (m && m[1] && !['print', 'len', 'str', 'int', 'float', 'type', 'list', 'dict', 'set', 'tuple', 'sorted', 'range'].includes(m[1])) {
      fnName = m[1];
      sampleCall = tc.code.trim();
      break;
    }
  }

  if (!fnName) continue;

  const desc = p.description || '';
  const initial = p.initialCode || '';
  
  const inDesc = desc.includes(fnName);
  const inInitial = initial.includes(fnName);

  if (!inDesc || !inInitial) {
    list.push({
      id: p.id,
      title: p.title,
      category: p.category,
      fnName,
      sampleCall,
      inDesc,
      inInitial,
      initialCode: initial.replace(/\n/g, ' ')
    });
  }
}

console.log('Count:', list.length);
list.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.id}] (${item.category}) "${item.title}" -> fn: ${item.fnName} | inDesc: ${item.inDesc} | inInitial: ${item.inInitial}`);
});
