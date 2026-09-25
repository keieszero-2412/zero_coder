const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

console.log('Quiz 1:', data[0].quizTitle, data[0].questions.map(q => ({ q: q.question, opts: q.options })));
console.log('Quiz 5:', data[4].quizTitle, data[4].questions.map(q => ({ q: q.question, opts: q.options })));
