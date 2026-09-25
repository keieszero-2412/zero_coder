const fs = require('fs');
const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));
const rawData = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

const q8 = problems.find(p => p.id === 'last_term_quiz_8');
const q11 = problems.find(p => p.id === 'last_term_quiz_11');
const q12 = problems.find(p => p.id === 'last_term_quiz_12');

function compareQuiz(quizObj, rawQuiz, quizName) {
  console.log(`\n========================================`);
  console.log(`AUDIT: ${quizName}`);
  console.log(`========================================`);
  
  quizObj.questions.forEach((q, i) => {
    const rawQ = rawQuiz.questions[i];
    const studentChoice = rawQ ? rawQ.selectedAnswer : 'None';
    const keyAnswer = quizObj.correctAnswers[String(i)] || quizObj.correctAnswers[i];
    
    // Check if key matches student
    const studentLetter = studentChoice ? (studentChoice.match(/^([A-Z])\./) ? studentChoice.match(/^([A-Z])\./)[1] : null) : null;
    const isSameAsStudent = Array.isArray(keyAnswer) ? (keyAnswer.length === 1 && keyAnswer[0] === studentLetter) : (keyAnswer === studentLetter);

    console.log(`Q${i+1}: ${q.text.split('\n')[0]}`);
    console.log(`   Student selected: ${studentChoice ? studentChoice.split('\n')[0] : 'None'} (Letter: ${studentLetter})`);
    console.log(`   ZeroCoder key   : ${JSON.stringify(keyAnswer)}`);
    console.log(`   Status          : ${isSameAsStudent ? 'MATCHES STUDENT' : 'DIFFERENT FROM STUDENT (Corrected/Multi-select)'}`);
  });
}

compareQuiz(q8, rawData[1], 'Quiz 8: Model Development');
compareQuiz(q11, rawData[2], 'Quiz 11: Monitoring System');
compareQuiz(q12, rawData[3], 'Quiz 12: Final Quiz');
