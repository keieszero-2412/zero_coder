const fs = require('fs');
const path = require('path');

const generatedQuizzes = JSON.parse(fs.readFileSync('scratch/generated_quizzes.json', 'utf8'));

const targets = [
  'public/problems.json',
  'admin_backups/problems.json',
  'dist/problems.json'
];

targets.forEach(targetPath => {
  if (fs.existsSync(targetPath)) {
    const problems = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    // Remove if already exists to prevent duplicate
    const filtered = problems.filter(p => !generatedQuizzes.some(g => String(g.id) === String(p.id)));
    // Append the 3 new quizzes
    const updated = [...filtered, ...generatedQuizzes];
    fs.writeFileSync(targetPath, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`Updated ${targetPath}: total problems = ${updated.length}`);
  } else {
    console.log(`File does not exist: ${targetPath}`);
  }
});
