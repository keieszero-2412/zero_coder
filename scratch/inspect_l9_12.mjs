import fs from 'fs';
import path from 'path';

const baseDir = 'd:/PYTHON/ZEROCODER/Last-term lectures';
const lectures = ['Lecture9', 'Lecture10', 'Lecture11', 'Lecture12'];

for (const lec of lectures) {
  const lecDir = path.join(baseDir, lec);
  const files = fs.readdirSync(lecDir);
  console.log(`\n=================== ${lec} ===================`);
  for (const f of files) {
    if (f.endsWith('.ipynb')) {
      const p = path.join(lecDir, f);
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const codeCells = data.cells.filter(c => c.cell_type === 'code');
      console.log(`[Notebook] ${f}`);
      console.log(`  Total cells: ${data.cells.length}, Code cells: ${codeCells.length}`);
      
      // Collect imports
      const imports = new Set();
      for (const c of codeCells) {
        const src = Array.isArray(c.source) ? c.source.join('') : (c.source || '');
        const lines = src.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            imports.add(trimmed);
          }
        }
      }
      console.log(`  Imports found:`, Array.from(imports).slice(0, 15));
    }
  }
}
