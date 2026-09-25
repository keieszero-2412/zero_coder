const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const localAppData = process.env.LOCALAPPDATA;
const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');

// 1. Scan History files for URLs
['Default', 'Profile 1'].forEach(prof => {
  const historyPath = path.join(edgeUserData, prof, 'History');
  if (fs.existsSync(historyPath)) {
    const copyPath = path.join(__dirname, `history_${prof}.db`);
    try {
      fs.copyFileSync(historyPath, copyPath);
      const buf = fs.readFileSync(copyPath);
      const text = buf.toString('latin1');
      
      const regex = /https?:\/\/ftds\.online[a-zA-Z0-9_\-\.\/\?&=%#]*/g;
      const matches = text.match(regex) || [];
      const unique = Array.from(new Set(matches));
      console.log(`\n================ History [${prof}] ================`);
      console.log(`Found ${unique.length} unique ftds.online URLs in history:`);
      unique.filter(u => u.includes('quiz')).forEach(u => console.log('  ', u));
    } catch (e) {
      console.error(`Failed reading history for ${prof}:`, e.message);
    }
  }
});
