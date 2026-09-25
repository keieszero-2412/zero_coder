const fs = require('fs');
const path = require('path');

const localAppData = process.env.LOCALAPPDATA;
const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');

['Default', 'Profile 1'].forEach(prof => {
  const lsDir = path.join(edgeUserData, prof, 'Local Storage', 'leveldb');
  console.log(`\n================ Checking Local Storage [${prof}] ================`);
  if (fs.existsSync(lsDir)) {
    const files = fs.readdirSync(lsDir);
    let totalFtdsHits = 0;
    files.forEach(f => {
      try {
        const filePath = path.join(lsDir, f);
        const buf = fs.readFileSync(filePath);
        if (buf.includes('ftds.online')) {
          totalFtdsHits++;
          console.log(`Hit in ${f} (${buf.length} bytes)`);
          // Extract text snippets
          const str = buf.toString('utf8');
          // Find any quiz snippets
          const idx = str.indexOf('ftds.online');
          console.log('Snippet:', JSON.stringify(str.substring(Math.max(0, idx - 50), idx + 200)));
        }
      } catch (e) {}
    });
    console.log(`Total ftds.online hits in ${prof} Local Storage: ${totalFtdsHits}`);
  }

  // Also check Sessions folder
  const sessDir = path.join(edgeUserData, prof, 'Sessions');
  console.log(`\n================ Checking Sessions [${prof}] ================`);
  if (fs.existsSync(sessDir)) {
    const files = fs.readdirSync(sessDir);
    files.forEach(f => {
      try {
        const filePath = path.join(sessDir, f);
        const buf = fs.readFileSync(filePath);
        if (buf.includes('ftds.online')) {
          console.log(`Hit in Session file ${f} (${buf.length} bytes)`);
        }
      } catch (e) {}
    });
  }
});
