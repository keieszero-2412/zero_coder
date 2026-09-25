const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const localAppData = process.env.LOCALAPPDATA;
const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');

['Default', 'Profile 1'].forEach(prof => {
  const cacheDir = path.join(edgeUserData, prof, 'Cache', 'Cache_Data');
  console.log(`\n================ Scanning block files in [${prof}] ================`);
  ['data_0', 'data_1', 'data_2', 'data_3'].forEach(f => {
    const filePath = path.join(cacheDir, f);
    if (!fs.existsSync(filePath)) return;
    try {
      const buf = fs.readFileSync(filePath);
      const str = buf.toString('latin1');
      const matches = str.match(/https?:\/\/ftds\.online[^\s\x00-\x1f"']*/g) || [];
      const quizMatches = matches.filter(m => m.includes('quiz'));
      console.log(`File ${f} (${buf.length} bytes): found ${matches.length} ftds URLs, ${quizMatches.length} quiz URLs`);
      if (quizMatches.length > 0) {
        Array.from(new Set(quizMatches)).forEach(u => console.log('  ', u));
      }
    } catch (e) {
      console.error(`Error reading ${f}:`, e.message);
    }
  });
});
