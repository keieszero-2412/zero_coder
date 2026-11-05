const test = require('node:test');
const assert = require('node:assert/strict');

const markdown = '$$ L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i| $$';

test('Unified produces a KaTeX HAST tree without requiring a string compiler', async () => {
  const [{ preprocessMarkdown }, { unified }, { default: remarkParse }, { default: remarkMath }, { default: remarkRehype }, { default: rehypeKatex }] = await Promise.all([
    import('../src/utils/latexHelper.js'),
    import('unified'),
    import('remark-parse'),
    import('remark-math'),
    import('remark-rehype'),
    import('rehype-katex'),
  ]);
  const processor = unified().use(remarkParse).use(remarkMath).use(remarkRehype).use(rehypeKatex);
  // parse/runSync return HAST; processSync would additionally require a compiler.
  const tree = processor.runSync(processor.parse(preprocessMarkdown(markdown)));
  const elements = [];
  function collect(node) {
    if (node.type === 'element') elements.push(node);
    for (const child of node.children || []) collect(child);
  }
  collect(tree);
  assert.equal(tree.type, 'root');
  assert.ok(elements.some(node => node.tagName === 'math'));
  assert.ok(elements.some(node => node.properties?.className?.includes('katex')));
  assert.ok(!elements.some(node => node.properties?.className?.includes('katex-error')));
});
