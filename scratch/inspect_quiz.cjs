const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

console.log('Total quizzes scraped:', data.length);
data.forEach((q, i) => {
  console.log(`[${i + 1}] Title: "${q.quizTitle}" | Section: "${q.section}" | Qs: ${q.questions?.length || 0}`);
  if (i === 0 && q.questions?.length > 0) {
    console.log('Sample question 1:', JSON.stringify(q.questions[0], null, 2));
  }
});
