const fs = require('fs');
const path = require('path');

const filePath = path.join(
  process.env.LOCALAPPDATA,
  'Microsoft',
  'Edge',
  'User Data',
  'Default',
  'Local Storage',
  'leveldb',
  '004176.ldb'
);

const buf = fs.readFileSync(filePath);
console.log('Read file, size:', buf.length);

const needle = Buffer.from('ftds.online');
let pos = 0;
let hits = [];

while ((pos = buf.indexOf(needle, pos)) !== -1) {
  hits.push(pos);
  pos += needle.length;
}

console.log('Found', hits.length, 'occurrences of ftds.online');

hits.forEach((idx, i) => {
  const start = Math.max(0, idx - 100);
  const end = Math.min(buf.length, idx + 400);
  const slice = buf.subarray(start, end);
  // printable ascii or unicode
  let text = '';
  for (let b of slice) {
    if (b >= 32 && b <= 126) text += String.fromCharCode(b);
    else text += '·';
  }
  console.log(`\nHit #${i + 1} at ${idx}:`);
  console.log(text);
});
