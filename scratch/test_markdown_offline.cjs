const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const katex = require('katex');

// Literal inputs retained from the original probes, which remain untouched.
const markdownCases = [
  { name: 'empty math (test_empty.cjs)', input: 'Here is some math: $$ $$' },
  { name: 'undefined macro (test_katex.cjs)', input: 'Here is some math: $$ \\sum_{i=1}^{n} w_i \\undefined $$', command: '\\undefined' },
  { name: 'foo macro (test_katex2.cjs)', input: 'Here is some math: $$ \\sum_{i=1}^{n} w_i \\foo $$', command: '\\foo' },
  { name: 'inline align rejects display-only environment (test_katex_align.cjs)', input: 'Here is some math: $$ \\begin{align} L &= 1 \\end{align} $$', error: true },
];

for (const fixture of markdownCases) {
  test(fixture.name, async () => {
    const [{ preprocessMarkdown }, { default: ReactMarkdown }, { default: remarkMath }, { default: rehypeKatex }] = await Promise.all([
      import('../src/utils/latexHelper.js'),
      import('react-markdown'),
      import('remark-math'),
      import('rehype-katex'),
    ]);
    const html = renderToStaticMarkup(React.createElement(ReactMarkdown, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }, preprocessMarkdown(fixture.input)));
    assert.match(html, /Here is some math:/);
    if (fixture.error) {
      assert.match(html, /class="katex-error"/);
      assert.match(html, /align.*display mode/);
    } else {
      assert.match(html, /class="katex"/);
      assert.match(html, /<math\b/);
      assert.doesNotMatch(html, /class="katex-error"/);
      if (fixture.command) {
        assert.match(html, /style="color:#cc0000"/);
        assert.ok(html.includes(fixture.command));
      }
    }
  });
}

test('direct KaTeX Lasso fixture renders without error markup', async () => {
  const { preprocessMarkdown } = await import('../src/utils/latexHelper.js');
  const formula = 'L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i|';
  const html = katex.renderToString(preprocessMarkdown(formula), { throwOnError: false });
  assert.match(html, /<math\b/);
  assert.doesNotMatch(html, /class="katex-error"/);
  assert.ok(html.includes('\\lambda'));
});

test('legacy regex fixture characterizes current production normalization', async () => {
  const { preprocessMarkdown } = await import('../src/utils/latexHelper.js');
  // Characterization only: this does not claim the legacy single-line display math is valid CommonMark.
  assert.equal(preprocessMarkdown('test\n$$math$$'), 'test\n\n$$\n\nmath$$');
});

test('strict KaTeX explicitly rejects an undefined command', () => {
  assert.throws(() => katex.renderToString('\\undefined', { throwOnError: true }), katex.ParseError);
});

test('offline guard rejects network operations before connection', () => {
  // Fail before attempting any connection if this file is accidentally run without the preload.
  assert.equal(globalThis[Symbol.for('zerocoder.offline')], true);
  const blocked = /Offline tests block network and child processes/;
  assert.throws(() => fetch('https://example.invalid'), blocked);
  assert.throws(() => require('node:http').get('http://example.invalid'), blocked);
  assert.throws(() => require('node:https').get('https://example.invalid'), blocked);
  assert.throws(() => require('node:net').connect({ host: '127.0.0.1', port: 1 }), blocked);
  assert.throws(() => require('node:dns').lookup('example.invalid'), blocked);
  assert.throws(() => require('node:dns').promises.lookup('example.invalid'), blocked);
  assert.throws(() => require('node:tls').connect({ host: 'example.invalid', port: 443 }), blocked);
  assert.throws(() => require('node:http2').connect('https://example.invalid'), blocked);
  assert.throws(() => require('node:dgram').Socket.prototype.send(), blocked);
  assert.throws(() => require('node:net').Server.prototype.listen(), blocked);
});

test('offline permissions reject filesystem writes and child processes', () => {
  assert.equal(process.permission?.has('fs.write'), false);
  assert.throws(() => require('node:fs').writeFileSync('offline-write-probe', 'blocked'), { code: 'ERR_ACCESS_DENIED' });
  assert.throws(() => require('node:child_process').spawn(process.execPath), /Offline tests block network and child processes/);
});
