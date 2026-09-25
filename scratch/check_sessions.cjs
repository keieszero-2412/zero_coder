const fs = require('fs');
const path = require('path');

const localAppData = process.env.LOCALAPPDATA;
const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');

['Default', 'Profile 1'].forEach(prof => {
  const sessDir = path.join(edgeUserData, prof, 'Sessions');
  if (!fs.existsSync(sessDir)) return;
  const files = fs.readdirSync(sessDir);
  files.forEach(f => {
    const filePath = path.join(sessDir, f);
    try {
      const buf = fs.readFileSync(filePath);
      const str = buf.toString('latin1');
      if (str.includes('ftds.online')) {
        console.log(`\n=== Found ftds.online in ${prof}/Sessions/${f} (${buf.length} bytes) ===`);
        // Find all strings containing ftds.online
        const matches = str.match(/[^\x00-\x1f]{4,100}ftds\.online[^\x00-\x1f]{0,100}/g) || [];
        console.log('Sample matches (first 10):', matches.slice(0, 10));

        // Check if there are any Vietnamese question snippets or "Câu" or "quiz"
        const vietnameseMatches = str.match(/Câu \d+:[^\x00-\x1f]{10,100}/g) || [];
        console.log('Question matches:', vietnameseMatches.length);
        if (vietnameseMatches.length > 0) {
          console.log('Sample questions:', vietnameseMatches.slice(0, 5));
        }
      }
    } catch (e) {}
  });
});
