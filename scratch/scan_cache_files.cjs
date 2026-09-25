const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const localAppData = process.env.LOCALAPPDATA;
const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');

const profiles = ['Default', 'Profile 1'];

const targetKeywords = [
  'cmid=794', 'cmid=799', 'cmid=803', 'cmid=808', 'cmid=816', 'cmid=820',
  'attempt=23704', 'attempt=24186', 'attempt=24678', 'attempt=25072', 'attempt=25628', 'attempt=25665',
  'ftds.online/mod/quiz', 'class="qtext"', 'class="que '
];

const foundHits = [];

profiles.forEach(prof => {
  const cacheDir = path.join(edgeUserData, prof, 'Cache', 'Cache_Data');
  if (!fs.existsSync(cacheDir)) return;

  const files = fs.readdirSync(cacheDir);
  console.log(`Scanning ${files.length} cache files in ${prof}...`);

  for (const file of files) {
    const filePath = path.join(cacheDir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.size < 50) continue; // skip tiny index/header files

      const buf = fs.readFileSync(filePath);

      // Try raw buffer scan
      const str = buf.toString('latin1');
      let matched = targetKeywords.filter(k => str.includes(k));

      // Also try gunzip in case content is gzipped
      let decompressed = null;
      // Search for gzip magic header (0x1f, 0x8b)
      for (let i = 0; i < buf.length - 10; i++) {
        if (buf[i] === 0x1f && buf[i+1] === 0x8b && buf[i+2] === 0x08) {
          try {
            const inflated = zlib.gunzipSync(buf.subarray(i));
            const inflatedStr = inflated.toString('utf8');
            const infMatched = targetKeywords.filter(k => inflatedStr.includes(k));
            if (infMatched.length > 0) {
              decompressed = inflatedStr;
              matched = Array.from(new Set([...matched, ...infMatched]));
              break;
            }
          } catch (e) {
            // not valid gzip chunk, continue
          }
        }
      }

      if (matched.length > 0) {
        console.log(`HIT in [${prof}/${file}]: matched [${matched.join(', ')}] (size: ${stat.size} bytes)`);
        foundHits.push({
          prof,
          file,
          matched,
          size: stat.size,
          hasHtml: (decompressed || str).includes('<div class="qtext">') || (decompressed || str).includes('class="que'),
          content: decompressed || str
        });
      }
    } catch (err) {
      // file might be locked by Edge or read error
    }
  }
});

console.log(`\n================ Total Hits: ${foundHits.length} ================`);
foundHits.forEach((hit, idx) => {
  console.log(`[${idx+1}] ${hit.prof}/${hit.file}: matched=${hit.matched.join(',')} hasHtml=${hit.hasHtml}`);
  // If it has HTML question content, save to scratch
  if (hit.hasHtml) {
    const outName = `extracted_cache_${hit.prof}_${hit.file}.html`;
    fs.writeFileSync(path.join(__dirname, outName), hit.content, 'utf8');
    console.log(`    >>> Saved to scratch/${outName}`);
  }
});
