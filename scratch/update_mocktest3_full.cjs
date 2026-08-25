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

const q1 = problems.find(p => p.id === 'mock3_1');
if (q1) {
  q1.testCases = [
    { id: 1, code: "print(compound_balance(100.0, 10.0, 2))", expected: "121.0" },
    { id: 2, code: "print(compound_balance(200.0, 7.5, 3))", expected: "248.46" },
    { id: 3, code: "print(compound_balance(1000.0, 5.0, 10))", expected: "1628.89" },
    { id: 4, code: "print(compound_balance(50.0, 6.0, 1))", expected: "53.0" },
    { id: 5, code: "print(compound_balance(1000.0, 0.0, 5))", expected: "1000.0" }
  ];
}

const q2 = problems.find(p => p.id === 'mock3_2');
if (q2) {
  q2.testCases = [
    { id: 1, code: "print(debt_group(45))", expected: "2" },
    { id: 2, code: "print(debt_group(0))", expected: "1" },
    { id: 3, code: "print(debt_group(90))", expected: "3" },
    { id: 4, code: "print(debt_group(200))", expected: "4" },
    { id: 5, code: "print(debt_group(400))", expected: "5" }
  ];
}

const q3 = problems.find(p => p.id === 'mock3_3');
if (q3) {
  q3.testCases = [
    { id: 1, code: "print(spending_by_category([{\"category\": \"An uong\", \"amount\": 120.5}, {\"category\": \"Di lai\", \"amount\": 40.0}, {\"category\": \"An uong\", \"amount\": 79.5}]))", expected: "{'An uong': 200.0, 'Di lai': 40.0}" },
    { id: 2, code: "print(spending_by_category([{\"category\": \"Hoc phi\", \"amount\": 5000.0}, {\"category\": \"Giai tri\", \"amount\": 250.25}, {\"category\": \"Giai tri\", \"amount\": 149.75}, {\"category\": \"Hoa don\", \"amount\": 800.0}]))", expected: "{'Hoc phi': 5000.0, 'Giai tri': 400.0, 'Hoa don': 800.0}" },
    { id: 3, code: "print(spending_by_category([{\"category\": \"Mua sam\", \"amount\": 99.99}]))", expected: "{'Mua sam': 99.99}" },
    { id: 4, code: "print(spending_by_category([{\"category\": \"X\", \"amount\": 1.5}, {\"category\": \"X\", \"amount\": 2.5}, {\"category\": \"X\", \"amount\": 6.0}]))", expected: "{'X': 10.0}" },
    { id: 5, code: "print(spending_by_category([]))", expected: "{}" }
  ];
}

const q4 = problems.find(p => p.id === 'mock3_4');
if (q4) {
  q4.testCases = [
    { id: 1, code: "print(moving_average([10, 20, 30, 40], 2))", expected: "[15.0, 25.0, 35.0]" },
    { id: 2, code: "print(moving_average([1, 2, 3, 4, 5], 3))", expected: "[2.0, 3.0, 4.0]" },
    { id: 3, code: "print(moving_average([10.5, 11.5, 9.0, 13.0], 2))", expected: "[11.0, 10.25, 11.0]" },
    { id: 4, code: "print(moving_average([5, 5], 2))", expected: "[5.0]" },
    { id: 5, code: "print(moving_average([1, 2], 5))", expected: "[]" }
  ];
}

const q5 = problems.find(p => p.id === 'mock3_5');
if (q5) {
  q5.testCases = [
    { id: 1, code: "print(fund_ranking({\"Alpha\": 12.5, \"Beta\": -3.0, \"Gamma\": 12.5, \"Delta\": 7.0}))", expected: "[('Alpha', 12.5), ('Gamma', 12.5), ('Delta', 7.0)]" },
    { id: 2, code: "print(fund_ranking({\"A\": 1.0, \"B\": 2.0}))", expected: "[('B', 2.0), ('A', 1.0)]" },
    { id: 3, code: "print(fund_ranking({\"VN30\": 8.4, \"Bond\": 0.0, \"Gold\": -2.5}))", expected: "[('VN30', 8.4)]" },
    { id: 4, code: "print(fund_ranking({\"X\": -1.0, \"Y\": -5.0}))", expected: "[]" },
    { id: 5, code: "print(fund_ranking({}))", expected: "[]" }
  ];
}

const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
fs.writeFileSync(problemsPath, newContent, 'utf8');
console.log('Successfully updated full test cases for Mock test 3.');
