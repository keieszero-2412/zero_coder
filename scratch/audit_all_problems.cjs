const fs = require('fs');
const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));

console.log('=== AUDITING ALL PROBLEMS ===');

const issues = {
  doubleEscapedNewlines: [],
  testOverridesUserFunction: [],
  missingDefsInInitialCode: [],
  syntaxErrorsInTestCases: []
};

for (const p of problems) {
  if (p.type === 'multiple_choice' || !p.testCases) continue;

  p.testCases.forEach((tc, idx) => {
    if (!tc.code) return;

    // 1. Double escaped newlines
    if (tc.code.includes('\\n')) {
      issues.doubleEscapedNewlines.push({ id: p.id, title: p.title, tcId: tc.id, code: tc.code });
    }

    // 2. Test code re-defines def <fn>
    if (/def\s+[a-zA-Z0-9_]+\s*\(/.test(tc.code)) {
      issues.testOverridesUserFunction.push({ id: p.id, title: p.title, tcId: tc.id, code: tc.code });
    }
  });

  // 3. InitialCode missing functions that are called in test cases
  const initial = p.initialCode || '';
  const initialDefs = new Set();
  const initMatches = initial.matchAll(/def\s+([a-zA-Z0-9_]+)\s*\(/g);
  for (const m of initMatches) {
    initialDefs.add(m[1]);
  }

  // Find functions called in test cases
  const calledFns = new Set();
  p.testCases.forEach(tc => {
    if (!tc.code) return;
    // Strip any internal def lines if any
    const codeLines = tc.code.split('\n').filter(l => !l.trim().startsWith('def ') && !l.trim().startsWith('return '));
    const cleanCode = codeLines.join('\n');
    const matches = cleanCode.matchAll(/(?:print\s*\(\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
    for (const m of matches) {
      const name = m[1];
      if (!['print', 'len', 'str', 'int', 'float', 'type', 'list', 'dict', 'set', 'tuple', 'sorted', 'range', 'round', 'sum', 'min', 'max', 'date', 'datetime', 'np', 'pd', 'plt', 'math'].includes(name)) {
        calledFns.add(name);
      }
    }
  });

  for (const fn of calledFns) {
    if (!initialDefs.has(fn)) {
      issues.missingDefsInInitialCode.push({
        id: p.id,
        title: p.title,
        calledFn: fn,
        currentInitialDefs: [...initialDefs],
        sampleTC: p.testCases[0]?.code
      });
    }
  }
}

console.log('1. Double escaped newlines count:', issues.doubleEscapedNewlines.length);
console.log(JSON.stringify(issues.doubleEscapedNewlines, null, 2));

console.log('\n2. Test re-defines def count:', issues.testOverridesUserFunction.length);
console.log(JSON.stringify(issues.testOverridesUserFunction, null, 2));

console.log('\n3. Missing def in initialCode count:', issues.missingDefsInInitialCode.length);
console.log(JSON.stringify(issues.missingDefsInInitialCode, null, 2));
