const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Run only the fixed list in one permission-restricted process (verified on Node 22.14).
const root = path.resolve(__dirname, '..');
const files = [
  'test_latexHelper.cjs',
  'test_render.cjs',
  'test_unified.cjs',
  'test_markdown_offline.cjs',
];
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'zerocoder-test-offline-'));
// Do not forward NODE_OPTIONS or provider/Firebase credentials into the test process.
const env = {};
for (const name of ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP']) {
  if (process.env[name] !== undefined) env[name] = process.env[name];
}
try {
  const result = spawnSync(process.execPath, [
    '--experimental-permission',
    `--allow-fs-read=${root}`,
    `--allow-fs-read=${cwd}`,
    '--unhandled-rejections=strict',
    '--require', path.join(__dirname, 'offline_guard.cjs'),
    '--test-reporter=tap',
    '--eval',
    `for (const file of ${JSON.stringify(files.map(file => path.join(__dirname, file)))}) require(file);`,
  ], { cwd, env, stdio: 'inherit', timeout: 60_000 });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
} finally {
  // The permission-restricted child cannot create files in its isolated cwd.
  fs.rmdirSync(cwd);
}
