const fs = require('fs');
let code = fs.readFileSync('src/data/problems.js', 'utf8');

// The description is currently:
// <li>Hai danh sách luôn có cùng độ dài; nếu rỗng thì trả về 0.0.</li>
const oldDesc = "Hai danh sách luôn có cùng độ dài; nếu rỗng thì trả về 0.0.";
const newDesc = "Nếu hai danh sách có độ dài khác nhau, trả về None. Nếu rỗng thì trả về 0.0.";

if (code.includes(oldDesc)) {
  code = code.replace(oldDesc, newDesc);
}

if(code.includes('"id": "mock1_1"')) {
   let startIdx = code.indexOf('"id": "mock1_1"');
   let testCasesStr = '"testCases": [';
   let testCasesStart = code.indexOf(testCasesStr, startIdx);
   
   let openBrackets = 0;
   let testCasesEnd = -1;
   for (let i = testCasesStart + testCasesStr.length - 1; i < code.length; i++) {
       if (code[i] === '[') openBrackets++;
       else if (code[i] === ']') {
           openBrackets--;
           if (openBrackets === 0) {
               testCasesEnd = i;
               break;
           }
       }
   }
   
   const newTestCase = `
        {
          "id": 6,
          "code": "print(total_revenue([10.5, 20.0], [2, 3, 4]))",
          "expected": "None"
        }`;
        
   const before = code.substring(0, testCasesEnd);
   // Insert new testcase before the closing bracket
   const insertIndex = before.lastIndexOf('}');
   
   const finalCode = before.substring(0, insertIndex + 1) + "," + newTestCase + "\n      " + code.substring(testCasesEnd);
   
   fs.writeFileSync('src/data/problems.js', finalCode, 'utf8');
   console.log('Successfully updated mock1_1 description and added test case.');
} else {
   console.log('mock1_1 not found');
}
