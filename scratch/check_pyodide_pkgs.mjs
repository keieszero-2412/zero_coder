import fs from 'fs';

const data = JSON.parse(fs.readFileSync('d:/PYTHON/ZEROCODER/public/pyodide/pyodide-lock.json', 'utf8'));
const pkgs = Object.keys(data.packages);

const interesting = ['scikit', 'learn', 'sklearn', 'scipy', 'mlxtend', 'plotly', 'ipywidgets', 'statsmodels'];

console.log('Total packages in pyodide-lock.json:', pkgs.length);
for (const p of pkgs) {
  for (const item of interesting) {
    if (p.toLowerCase().includes(item)) {
      console.log(`Matched [${item}]:`, p, '->', data.packages[p].file_name);
    }
  }
}
