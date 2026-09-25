const fs = require('fs');
const path = require('path');

const filePath = path.join(
  process.env.LOCALAPPDATA,
  'Microsoft',
  'Edge',
  'User Data',
  'Default',
  'Sessions',
  'Tabs_13434738055026945'
);

const buf = fs.readFileSync(filePath);
console.log('Read Tabs file, size:', buf.length);

const needle = Buffer.from('ftds.online');
let pos = 0;
let hits = [];

while ((pos = buf.indexOf(needle, pos)) !== -1) {
  hits.push(pos);
  pos += needle.length;
}

console.log('Found', hits.length, 'occurrences of ftds.online in Tabs file');

hits.forEach((idx, i) => {
  const start = Math.max(0, idx - 50);
  const end = Math.min(buf.length, idx + 150);
  const slice = buf.subarray(start, end);
  let text = '';
  for (let b of slice) {
    if (b >= 32 && b <= 126) text += String.fromCharCode(b);
    else text += ' ';
  }
  console.log(`Hit #${i + 1} at ${idx}: ${text.trim()}`);
});
