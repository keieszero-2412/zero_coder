const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

console.log('Quizzes count:', data.length);
data.forEach((q, idx) => {
  console.log(`\n=== Quiz ${idx + 1}: "${q.quizTitle}" ===`);
  console.log('Total questions:', q.questions?.length);
  if (q.questions?.length > 0) {
    const q1 = q.questions[0];
    console.log('Q1 text:', q1.question.slice(0, 100));
    console.log('Q1 options count:', q1.options?.length, q1.options);
    console.log('Q1 selected:', q1.selectedAnswer);
    console.log('Q1 correct:', q1.correctAnswer);
  }
});
