const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

let out = '';
function dumpQuiz(idx, name) {
  out += `\n============================ ${name} ============================\n`;
  const qs = data[idx].questions;
  qs.forEach(q => {
    const title = q.question.split('\n')[0].trim();
    out += `\nQ${q.number}: ${title}\n`;
    q.options.forEach(o => {
      out += '   ' + o.split('\n')[0].trim() + '\n';
    });
    if (q.selectedAnswer) {
      out += '   >>> Selected: ' + q.selectedAnswer.split('\n')[0].trim() + '\n';
    }
  });
}

dumpQuiz(1, 'Quiz 8: Model Development');
dumpQuiz(2, 'Quiz 11: Monitoring System');
dumpQuiz(3, 'Quiz 12: Final Quiz');

fs.writeFileSync('scratch/quiz_summary_utf8.txt', out, 'utf8');
console.log('Saved utf8 summary to scratch/quiz_summary_utf8.txt');
