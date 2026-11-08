import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = file => readFileSync(resolve(root, file), 'utf8');
const errors = [], checked = new Set();
let links = 0, skills = 0;
function check(label, action) {
  try { action(); } catch (error) { errors.push(`${label}: ${error.message}`); }
}
function markdown(file) {
  if (checked.has(file)) return;
  checked.add(file);
  check(file, () => {
    const content = read(file);
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, '');
      assert.ok(!target.startsWith('file:'), `nonportable file URI: ${target}`);
      if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('#')) continue;
      const pathname = decodeURIComponent(target.split('#')[0]);
      const local = resolve(dirname(resolve(root, file)), pathname);
      assert.ok(existsSync(local), `missing link target ${target}`);
      links++;
    }
  });
}
function documents(directory) {
  for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) documents(file);
    else if (entry.name.endsWith('.md')) markdown(file);
  }
}
function field(header, key) {
  const match = header.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match?.[1].replace(/^['"]|['"]$/g, '');
}
function frontmatter(file) {
  const result = read(file).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(result, 'missing YAML frontmatter');
  return result[1];
}

for (const file of ['AGENTS.md', 'CLAUDE.md', 'DESIGN.md', 'PRODUCT.md', 'README.md', 'WIKI.md']) markdown(file);
for (const directory of ['.agents', '.claude', 'docs']) documents(directory);
for (const name of readdirSync(resolve(root, '.agents/rules'))) {
  if (!name.endsWith('.md')) continue;
  const file = `.agents/rules/${name}`;
  check(file, () => {
    const header = frontmatter(file), trigger = field(header, 'trigger');
    assert.ok(['always_on', 'model_decision', 'glob', 'manual'].includes(trigger), 'invalid Antigravity trigger');
    if (trigger === 'model_decision') assert.ok(field(header, 'description'), 'missing rule description');
    if (trigger === 'glob') assert.ok(field(header, 'glob') || field(header, 'globs'), 'missing glob pattern');
  });
}
for (const directory of ['.agents/skills', '.claude/skills']) {
  for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = `${directory}/${entry.name}/SKILL.md`;
    check(file, () => {
      const header = frontmatter(file);
      assert.equal(field(header, 'name'), entry.name, 'skill name differs from discovery directory');
      assert.ok(field(header, 'description'), 'missing skill description');
      if (directory === '.claude/skills') {
        const canonical = `.agents/skills/${entry.name}/SKILL.md`;
        assert.ok(existsSync(resolve(root, canonical)), 'missing canonical skill');
        assert.ok(read(file).includes(`../../../${canonical}`), 'missing canonical redirect');
        assert.equal(header.replace(/\r\n/g, '\n'), frontmatter(canonical).replace(/\r\n/g, '\n'), 'wrapper metadata drift');
      }
      skills++;
    });
  }
}
check('Claude native import', () => assert.match(read('CLAUDE.md'), /^@AGENTS\.md\s*$/m));
check('Impeccable configuration', () => {
  const config = JSON.parse(read('.impeccable/config.json'));
  assert.ok(['code', 'comp'].includes(config.buildPath), 'invalid buildPath');
  const sidecar = JSON.parse(read('.impeccable/design.json'));
  assert.equal(sidecar.schemaVersion, 2);
  assert.ok(sidecar.extensions && !sidecar.tokens, 'sidecar duplicates retired primitive-token arrays');
});
if (process.argv.includes('--installed')) {
  const home = process.env.ZERO_AGENT_SKILLS_ROOT || resolve(homedir(), '.agents/skills');
  const index = read('.agents/skills/INDEX.md');
  const names = new Set(index.split('\n').filter(line => line.includes('| Global ')).flatMap(line => [...line.matchAll(/`([a-z][a-z-]+)`/g)].map(match => match[1])));
  assert.ok(names.size > 0, 'global skill index is empty');
  for (const name of names) check(`installed ${name}`, () => assert.ok(existsSync(resolve(home, name, 'SKILL.md')), `not found in ${home}`));
  const workflow = read('.agents/rules/agent-workflow.md');
  for (const match of workflow.matchAll(/node ([A-Za-z]:\/[^\s`]+\/run\.cjs)/g)) {
    check('installed GitNexus runner', () => assert.ok(isAbsolute(match[1]) && existsSync(match[1]), match[1]));
  }
}
for (const error of errors) console.error(error);
console.log(JSON.stringify({ markdownFiles: checked.size, localLinks: links, skillEntries: skills, errors: errors.length,
  scope: 'structural paths and metadata; does not certify live host menus or production services' }));
if (errors.length) process.exitCode = 1;
