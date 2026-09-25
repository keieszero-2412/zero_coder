const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

const targetQuizzes = [data[1], data[2], data[3]]; // Quiz 8, 11, 12
let output = '';

targetQuizzes.forEach((quiz, qIdx) => {
  output += `\n=============================\n`;
  output += `QUIZ: ${quiz.quizTitle} (${quiz.questions.length} questions)\n`;
  output += `=============================\n`;
  quiz.questions.forEach((q, i) => {
    output += `\n[Câu ${i + 1}] ${q.question.replace(/\n+/g, ' ')}\n`;
    q.options.forEach(opt => {
      output += `  ${opt.replace(/\n+/g, ' ')}\n`;
    });
    output += `  -> Selected: ${q.selectedAnswer ? q.selectedAnswer.replace(/\n+/g, ' ') : 'None'}\n`;
  });
});

fs.writeFileSync('scratch/quiz_details.txt', output, 'utf8');
console.log('Saved quiz_details.txt in UTF-8');
