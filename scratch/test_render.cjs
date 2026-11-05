const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const displayedContent = "Lasso Regularization (L1) là kỹ thuật thêm vào hàm mất mát một hình phạt bằng tổng giá trị tuyệt đối của các hệ số:\\n\\n$$ L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i| $$";

test('production-preprocessed Lasso fixture renders as math without error markup', async () => {
  const [{ preprocessMarkdown }, { default: ReactMarkdown }, { default: remarkMath }, { default: rehypeKatex }] = await Promise.all([
    import('../src/utils/latexHelper.js'),
    import('react-markdown'),
    import('remark-math'),
    import('rehype-katex'),
  ]);
  const html = renderToStaticMarkup(React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  }, preprocessMarkdown(displayedContent)));
  assert.match(html, /Lasso Regularization/);
  assert.match(html, /class="katex"/);
  assert.match(html, /<math\b/);
  assert.doesNotMatch(html, /class="katex-error"/);
  assert.ok(html.includes('\\lambda'));
});
