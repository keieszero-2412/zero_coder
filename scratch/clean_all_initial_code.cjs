const fs = require('fs');

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

const targets = [
  'public/problems.json',
  'admin_backups/problems.json',
  'dist/problems.json'
];

targets.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = 0;
    data.forEach(p => {
      if (p.type !== 'multiple_choice') {
        if (p.initialCode) {
          const cleaned = cleanInitialCode(p.initialCode);
          if (cleaned !== p.initialCode) {
            p.initialCode = cleaned;
            modified++;
          }
        }
        if (p.defaultCode) {
          const cleanedDefault = cleanInitialCode(p.defaultCode);
          if (cleanedDefault !== p.defaultCode) {
            p.defaultCode = cleanedDefault;
          }
        }
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Cleaned ${filePath}: ${modified} problems updated.`);
  }
});
