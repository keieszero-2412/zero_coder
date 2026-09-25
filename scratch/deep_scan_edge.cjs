const fs = require('fs');
const path = require('path');

const edgeUserData = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data');
const profiles = ['Default', 'Profile 1'];
const targets = ['Local Storage/leveldb', 'IndexedDB', 'Sessions', 'Service Worker'];

const searchNeedles = [
  Buffer.from('ftds.online'),
  Buffer.from('23704'),
  Buffer.from('24186'),
  Buffer.from('24678'),
  Buffer.from('25628'),
  Buffer.from('25665')
];

function scanRecursive(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const full = path.join(dir, item);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(scanRecursive(full));
        } else if (stat.isFile() && stat.size > 0 && stat.size < 50 * 1024 * 1024) {
          const buf = fs.readFileSync(full);
          let matched = [];
          for (const needle of searchNeedles) {
            if (buf.includes(needle)) {
              matched.push(needle.toString());
            }
          }
          if (matched.length > 0) {
            results.push({ file: full, size: stat.size, matched });
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  return results;
}

profiles.forEach(prof => {
  targets.forEach(t => {
    const full = path.join(edgeUserData, prof, ...t.split('/'));
    if (fs.existsSync(full)) {
      const res = scanRecursive(full);
      if (res.length > 0) {
        console.log(`\n=== MATCHES in [${prof}] ${t} ===`);
        res.forEach(r => console.log(`  File: ${r.file} (${r.size}b) Matched: ${r.matched.join(', ')}`));
      }
    }
  });
});
console.log('\nScan complete.');
