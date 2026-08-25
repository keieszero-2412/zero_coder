import fs from 'fs';
const diff = fs.readFileSync('diff.txt', 'utf16le'); // PowerShell Select-Object output is often UTF-16LE, let's just try utf8 first if that fails
let text = '';
try {
  text = fs.readFileSync('diff.txt', 'utf8');
  if (text.includes('\u0000')) text = fs.readFileSync('diff.txt', 'utf16le');
} catch (e) {
  text = fs.readFileSync('diff.txt', 'utf16le');
}

const lines = text.split('\n');
let inTarget = false;
let recovered = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trimEnd();
  if (line.startsWith('-      {')) {
     if (lines[i+1] && lines[i+1].includes('id: 8,')) {
        inTarget = true;
     }
  }
  if (inTarget && line.startsWith('-')) {
    recovered.push(line.substring(1));
  }
  if (inTarget && line.includes('expected: "27"')) {
    break;
  }
}
fs.writeFileSync('recovered.txt', recovered.join('\n'));
console.log("Recovered lines: " + recovered.length);
