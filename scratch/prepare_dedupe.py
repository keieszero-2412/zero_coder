import re
import json

def clean_duplicates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The file has: export const problems = [ ... ];
    # Let's extract the array content
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    
    if start_idx == -1 or end_idx == 0:
        print("Could not parse JS array.")
        return
        
    array_str = content[start_idx:end_idx]
    
    # We can use regex or just eval in JS. But python can't eval JS directly due to unquoted keys in JS objects if there are any.
    # Wait, in parse_exams.py we generated it:
    # js_code += f"    id: {json.dumps(p['id'])},\n"
    # The keys are NOT quoted in our generator: `id: "...", category: "...", ...`
    
    # We can write a JS script to do the deduplication safely using Node.js
    js_script = f"""
import fs from 'fs';

// Read the original file
const content = fs.readFileSync('{file_path.replace("\\\\", "/")}', 'utf-8');

// A fragile but simple way to evaluate the exported array
// We can strip 'export const problems = ' and ';'
let arrayStr = content.replace('export const problems =', '').trim();
if (arrayStr.endsWith(';')) {{
    arrayStr = arrayStr.slice(0, -1);
}}

// Evaluate to get the array
const problems = eval(arrayStr);

// Deduplicate based on description
const seen = new Set();
const uniqueProblems = [];
let removed = 0;

for (const p of problems) {{
    // normalize description to detect dupes
    const normDesc = p.description.trim();
    if (!seen.has(normDesc)) {{
        seen.add(normDesc);
        uniqueProblems.push(p);
    }} else {{
        removed++;
        console.log('Removed duplicate:', p.title);
    }}
}}

// Re-generate the JS string in the exact format
let js_code = "export const problems = [\\n";
for (const p of uniqueProblems) {{
    js_code += "  {\\n";
    js_code += `    id: ${JSON.stringify(p.id)},\\n`;
    js_code += `    category: ${JSON.stringify(p.category)},\\n`;
    js_code += `    title: ${JSON.stringify(p.title)},\\n`;
    js_code += `    description: ${JSON.stringify(p.description)},\\n`;
    if (p.hint) {{
        js_code += `    hint: ${JSON.stringify(p.hint)},\\n`;
    }}
    js_code += `    initialCode: ${JSON.stringify(p.initialCode)},\\n`;
    js_code += "    testCases: [\\n";
    for (const t of p.testCases) {{
        js_code += "      {\\n";
        js_code += `        id: ${t.id},\\n`;
        js_code += `        code: ${JSON.stringify(t.code)},\\n`;
        js_code += `        expected: ${JSON.stringify(t.expected)}\\n`;
        js_code += "      },\\n";
    }}
    js_code += "    ]\\n";
    js_code += "  },\\n";
}}
js_code += "];\\n";

fs.writeFileSync('{file_path.replace("\\\\", "/")}', js_code, 'utf-8');
console.log('Done! Removed ' + removed + ' duplicates.');
"""
    with open('d:/PYTHON/ZEROCODER/scratch/dedupe.js', 'w', encoding='utf-8') as out:
        out.write(js_script)
    
if __name__ == '__main__':
    clean_duplicates('d:/PYTHON/ZEROCODER/src/data/problems.js')
