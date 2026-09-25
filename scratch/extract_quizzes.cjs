const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

const targetQuizzes = [data[1], data[2], data[3]]; // Quiz 8, 11, 12

targetQuizzes.forEach((quiz, qIdx) => {
  console.log(`\n=============================`);
  console.log(`QUIZ: ${quiz.quizTitle} (${quiz.questions.length} questions)`);
  console.log(`=============================`);
  quiz.questions.forEach((q, i) => {
    console.log(`\n[Câu ${i + 1}] ${q.question.replace(/\n+/g, ' ')}`);
    q.options.forEach(opt => console.log(`  ${opt.replace(/\n+/g, ' ')}`));
    console.log(`  -> Selected: ${q.selectedAnswer?.replace(/\n+/g, ' ')}`);
  });
});
