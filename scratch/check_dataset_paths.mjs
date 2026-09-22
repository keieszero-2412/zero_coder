import fs from 'fs';
import path from 'path';

const baseDir = 'd:/PYTHON/ZEROCODER/Last-term lectures';
const lectures = ['Lecture9', 'Lecture10', 'Lecture11', 'Lecture12'];

for (const lec of lectures) {
  const lecDir = path.join(baseDir, lec);
  const files = fs.readdirSync(lecDir);
  for (const f of files) {
    if (f.endsWith('.ipynb')) {
      const p = path.join(lecDir, f);
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log(`\n=================== [${lec}] ${f} ===================`);
      data.cells.forEach((c, idx) => {
        if (c.cell_type === 'code') {
          const src = Array.isArray(c.source) ? c.source.join('') : (c.source || '');
          const lines = src.split('\n');
          for (const line of lines) {
            if (/read_|load_|open\(|download/i.test(line) && !line.trim().startsWith('#')) {
              console.log(`  Cell ${idx}: ${line.trim()}`);
            }
          }
        }
      });
    }
  }
}
