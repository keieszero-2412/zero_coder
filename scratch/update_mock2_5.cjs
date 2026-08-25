const fs = require('fs');
const path = require('path');

const problemsPath = path.join(__dirname, '../src/data/problems.js');
let content = fs.readFileSync(problemsPath, 'utf8');

const match = content.match(/export const problems = (\[[\s\S]*\]);/);
if (!match) {
  console.error("Could not find problems array");
  process.exit(1);
}

let problems = eval(match[1]);

const q5 = problems.find(p => p.id === 'mock2_5');
if (q5) {
  q5.testCases = [
    { id: 1, code: "print(above_average({\"A\": 10, \"B\": 20, \"C\": 30}))", expected: "['C']" },
    { id: 2, code: "print(above_average({\"X\": 10, \"Y\": 30, \"Z\": 20, \"W\": 30}))", expected: "['W', 'Y']" },
    { id: 3, code: "print(above_average({\"A\": 1, \"B\": 2, \"C\": 3, \"D\": 10}))", expected: "['D']" },
    { id: 4, code: "print(above_average({\"A\": 5, \"B\": 5}))", expected: "[]" },
    { id: 5, code: "print(above_average({}))", expected: "[]" }
  ];
}

const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
fs.writeFileSync(problemsPath, newContent, 'utf8');
console.log('Successfully updated test cases for mock2_5.');
