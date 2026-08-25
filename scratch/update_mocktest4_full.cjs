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

// Q3
const q3 = problems.find(p => p.id === 'mock4_3');
if (q3) {
  q3.testCases = [
    { id: 1, code: "print(revenue_by_channel([{\"channel\": \"Shopee\", \"price\": 100.0, \"quantity\": 2}, {\"channel\": \"Web\", \"price\": 50.0, \"quantity\": 1}, {\"channel\": \"Shopee\", \"price\": 25.0, \"quantity\": 4}]))", expected: "{'Shopee': 300.0, 'Web': 50.0}" },
    { id: 2, code: "print(revenue_by_channel([{\"channel\": \"Tiktok\", \"price\": 12.5, \"quantity\": 4}, {\"channel\": \"Lazada\", \"price\": 30.0, \"quantity\": 3}, {\"channel\": \"Tiktok\", \"price\": 10.0, \"quantity\": 5}, {\"channel\": \"Web\", \"price\": 200.0, \"quantity\": 1}]))", expected: "{'Tiktok': 100.0, 'Lazada': 90.0, 'Web': 200.0}" },
    { id: 3, code: "print(revenue_by_channel([{\"channel\": \"Web\", \"price\": 19.99, \"quantity\": 1}]))", expected: "{'Web': 19.99}" },
    { id: 4, code: "print(revenue_by_channel([{\"channel\": \"A\", \"price\": 1.5, \"quantity\": 2}, {\"channel\": \"A\", \"price\": 2.0, \"quantity\": 5}]))", expected: "{'A': 13.0}" },
    { id: 5, code: "print(revenue_by_channel([]))", expected: "{}" }
  ];
}

// Q4
const q4 = problems.find(p => p.id === 'mock4_4');
if (q4) {
  q4.testCases = [
    { id: 1, code: "print(cumulative_share([10, 40, 50]))", expected: "[50.0, 90.0, 100.0]" },
    { id: 2, code: "print(cumulative_share([50, 30, 20]))", expected: "[50.0, 80.0, 100.0]" },
    { id: 3, code: "print(cumulative_share([25, 25, 25, 25]))", expected: "[25.0, 50.0, 75.0, 100.0]" },
    { id: 4, code: "print(cumulative_share([100]))", expected: "[100.0]" },
    { id: 5, code: "print(cumulative_share([]))", expected: "[]" }
  ];
}

// Q5
const q5 = problems.find(p => p.id === 'mock4_5');
if (q5) {
  q5.testCases = [
    { id: 1, code: "print(margin_ranking({\"A\": 100.0, \"B\": 200.0, \"C\": 50.0}, {\"A\": 60.0, \"B\": 100.0, \"C\": 45.0}))", expected: "['B', 'A', 'C']" },
    { id: 2, code: "print(margin_ranking({\"A\": 100.0, \"B\": 50.0}, {\"A\": 50.0, \"B\": 25.0}))", expected: "['A', 'B']" },
    { id: 3, code: "print(margin_ranking({\"A\": 100.0, \"B\": 100.0}, {\"A\": 120.0, \"B\": 50.0}))", expected: "['B', 'A']" },
    { id: 4, code: "print(margin_ranking({\"A\": 100.0, \"B\": 0.0}, {\"A\": 60.0, \"B\": 10.0}))", expected: "['A']" },
    { id: 5, code: "print(margin_ranking({}, {}))", expected: "[]" }
  ];
}

const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
fs.writeFileSync(problemsPath, newContent, 'utf8');
console.log('Successfully updated full test cases for Mock test 4.');
