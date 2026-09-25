const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

let out = '';
[1, 2, 3].forEach(idx => {
  const quiz = data[idx];
  out += `\n================== ${quiz.quizTitle} (${quiz.questions.length} questions) ==================\n`;
  quiz.questions.forEach((q, i) => {
    out += `\n--- Q${i+1} [Selected: ${q.selectedAnswer || 'None'}] ---\n`;
    out += q.question + '\n';
    q.options.forEach(opt => {
      out += '   ' + opt + '\n';
    });
  });
});

fs.writeFileSync('scratch/full_quizzes.txt', out, 'utf8');
console.log('Saved to scratch/full_quizzes.txt');
