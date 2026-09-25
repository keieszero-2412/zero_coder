const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

[1, 2, 3].forEach(idx => {
  const q = data[idx];
  console.log(`\n=== ${q.quizTitle} ===`);
  const correctCount = q.questions.filter(x => x.correctAnswer).length;
  const selectedCount = q.questions.filter(x => x.selectedAnswer).length;
  console.log(`Total: ${q.questions.length}, Has correctAnswer: ${correctCount}, Has selectedAnswer: ${selectedCount}`);
  if (correctCount > 0) {
    console.log('Sample correctAnswer:', q.questions.find(x => x.correctAnswer).correctAnswer);
  }
  if (selectedCount > 0) {
    console.log('Sample selectedAnswer:', q.questions.find(x => x.selectedAnswer).selectedAnswer);
  }
});
