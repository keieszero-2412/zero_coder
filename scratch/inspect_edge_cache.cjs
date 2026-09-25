const fs = require('fs');
const path = require('path');

const localAppData = process.env.LOCALAPPDATA;
const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');

console.log('Edge User Data path:', edgeUserData);

if (fs.existsSync(edgeUserData)) {
  const entries = fs.readdirSync(edgeUserData, { withFileTypes: true });
  const profiles = entries
    .filter(e => e.isDirectory() && (e.name === 'Default' || e.name.startsWith('Profile')))
    .map(e => e.name);
  console.log('Found Edge profiles:', profiles);

  profiles.forEach(prof => {
    const cacheDir = path.join(edgeUserData, prof, 'Cache', 'Cache_Data');
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      console.log(`Profile [${prof}] Cache_Data exists: ${files.length} files`);
    } else {
      console.log(`Profile [${prof}] Cache_Data does NOT exist`);
    }

    const historyFile = path.join(edgeUserData, prof, 'History');
    if (fs.existsSync(historyFile)) {
      const stats = fs.statSync(historyFile);
      console.log(`Profile [${prof}] History file size: ${stats.size} bytes`);
    }
  });
} else {
  console.log('Edge User Data directory not found!');
}
