import fs from 'fs';

// Read the original file
const content = fs.readFileSync('d:/PYTHON/ZEROCODER/src/data/problems.js', 'utf-8');

// Evaluate the exported array
let arrayStr = content.replace('export const problems =', '').trim();
if (arrayStr.endsWith(';')) {
    arrayStr = arrayStr.slice(0, -1);
}
const problems = eval(arrayStr);

const seenFuncs = new Set();
const uniqueProblems = [];
let removed = 0;

for (const p of problems) {
    // Extract function name from initialCode
    const match = p.initialCode.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (match) {
        const funcName = match[1];
        if (!seenFuncs.has(funcName)) {
            seenFuncs.add(funcName);
            uniqueProblems.push(p);
        } else {
            removed++;
            console.log('Removed duplicate:', p.title, '(Function:', funcName, ')');
        }
    } else {
        // If no function name found, just keep it
        uniqueProblems.push(p);
    }
}

// Re-generate the JS string
let js_code = "export const problems = [\n";
for (const p of uniqueProblems) {
    js_code += "  {\n";
    js_code += `    id: ${JSON.stringify(p.id)},\n`;
    js_code += `    category: ${JSON.stringify(p.category)},\n`;
    js_code += `    title: ${JSON.stringify(p.title)},\n`;
    js_code += `    description: ${JSON.stringify(p.description)},\n`;
    if (p.hint) {
        js_code += `    hint: ${JSON.stringify(p.hint)},\n`;
    }
    js_code += `    initialCode: ${JSON.stringify(p.initialCode)},\n`;
    js_code += "    testCases: [\n";
    for (const t of p.testCases) {
        js_code += "      {\n";
        js_code += `        id: ${t.id},\n`;
        js_code += `        code: ${JSON.stringify(t.code)},\n`;
        js_code += `        expected: ${JSON.stringify(t.expected)}\n`;
        js_code += "      },\n";
    }
    js_code += "    ]\n";
    js_code += "  },\n";
}
js_code += "];\n";

fs.writeFileSync('d:/PYTHON/ZEROCODER/src/data/problems.js', js_code, 'utf-8');
console.log('Done! Removed ' + removed + ' duplicates.');
