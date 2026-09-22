import fs from 'fs';
import path from 'path';

const sourceDir = path.join(process.cwd(), 'Last-term lectures');
const targetDir = path.join(process.cwd(), 'public', 'lectures');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const lecturesManifest = [];

function getAllFilesRecursive(dirPath, arrayOfFiles = [], basePath = '') {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const relPath = basePath ? path.join(basePath, file) : file;
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFilesRecursive(fullPath, arrayOfFiles, relPath);
    } else {
      arrayOfFiles.push(relPath);
    }
  });
  return arrayOfFiles;
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const dirs = fs.readdirSync(sourceDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('Lecture'));

for (const dir of dirs) {
  const lectureName = dir.name;
  const lectureSrcPath = path.join(sourceDir, lectureName);
  const lectureDestPath = path.join(targetDir, lectureName);
  
  if (!fs.existsSync(lectureDestPath)) {
    fs.mkdirSync(lectureDestPath, { recursive: true });
  }

  const notebooks = [];
  let datasetsDir = null;

  const items = fs.readdirSync(lectureSrcPath, { withFileTypes: true });
  for (const item of items) {
    if (item.isFile() && item.name.endsWith('.ipynb')) {
      const srcPath = path.join(lectureSrcPath, item.name);
      const destPath = path.join(lectureDestPath, item.name);
      fs.copyFileSync(srcPath, destPath);
      notebooks.push({
        id: item.name.replace('.ipynb', ''),
        title: item.name.replace('.ipynb', '').replace(/_/g, ' '),
        file: item.name
      });
    } else if (item.isDirectory() && item.name.includes('datasets')) {
      datasetsDir = item.name;
      const srcPath = path.join(lectureSrcPath, item.name);
      const destPath = path.join(lectureDestPath, item.name);
      copyRecursiveSync(srcPath, destPath);
    }
  }

  // Get all dataset files
  let datasetFiles = [];
  if (datasetsDir) {
    const fullDatasetsPath = path.join(lectureSrcPath, datasetsDir);
    datasetFiles = getAllFilesRecursive(fullDatasetsPath).map(f => path.join(datasetsDir, f).replace(/\\/g, '/'));
  }

  lecturesManifest.push({
    id: lectureName,
    title: lectureName.replace('Lecture', 'Lecture '),
    notebooks: notebooks,
    datasetsDir: datasetsDir,
    datasetFiles: datasetFiles
  });
}

// Write manifest
fs.writeFileSync(
  path.join(targetDir, 'lectures.json'), 
  JSON.stringify({ lectures: lecturesManifest }, null, 2)
);

console.log('Successfully prepared lecture data in public/lectures');
console.log(JSON.stringify({ lectures: lecturesManifest }, null, 2));
