const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const localAppData = process.env.LOCALAPPDATA;
const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');

const profiles = ['Default', 'Profile 1'];
const targetBuf = Buffer.from('ftds.online');

const hits = [];

profiles.forEach(prof => {
  const cacheDir = path.join(edgeUserData, prof, 'Cache', 'Cache_Data');
  if (!fs.existsSync(cacheDir)) return;

  const files = fs.readdirSync(cacheDir);
  console.log(`Scanning ${files.length} cache files in [${prof}]...`);

  for (const file of files) {
    if (!file.startsWith('f_')) continue;
    const filePath = path.join(cacheDir, file);
    try {
      const buf = fs.readFileSync(filePath);
      if (buf.includes(targetBuf)) {
        // Find URL string inside buffer
        const idx = buf.indexOf(targetBuf);
        // read ASCII string around targetBuf
        let urlStart = idx;
        while (urlStart > 0 && buf[urlStart - 1] >= 32 && buf[urlStart - 1] <= 126) urlStart--;
        let urlEnd = idx;
        while (urlEnd < buf.length && buf[urlEnd] >= 32 && buf[urlEnd] <= 126) urlEnd++;
        const url = buf.subarray(urlStart, urlEnd).toString('ascii');

        // Check if there's gzip stream in payload
        let htmlContent = null;
        const gzipIdx = buf.indexOf(Buffer.from([0x1f, 0x8b, 0x08]));
        if (gzipIdx !== -1) {
          try {
            const unzipped = zlib.gunzipSync(buf.subarray(gzipIdx));
            htmlContent = unzipped.toString('utf8');
          } catch (e) {
            // maybe not complete gzip or raw
          }
        }
        if (!htmlContent) {
          htmlContent = buf.toString('utf8');
        }

        const isQuizPage = htmlContent.includes('qtext') || htmlContent.includes('class="que') || url.includes('/mod/quiz/');

        hits.push({
          prof,
          file,
          url,
          size: buf.length,
          isQuizPage,
          hasQuestions: htmlContent.includes('class="qtext"')
        });

        if (htmlContent.includes('class="qtext"') || (isQuizPage && htmlContent.includes('form'))) {
          const outName = `quiz_${prof}_${file}.html`;
          fs.writeFileSync(path.join(__dirname, outName), htmlContent, 'utf8');
          console.log(`  -> SAVED HTML [${prof}/${file}] URL: ${url}`);
        }
      }
    } catch (err) {}
  }
});

console.log(`\nFound ${hits.length} ftds.online cache entries:`);
hits.forEach(h => {
  console.log(`- [${h.prof}] ${h.file} (${h.size}b) | isQuiz: ${h.isQuizPage} | hasQText: ${h.hasQuestions} | URL: ${h.url}`);
});
