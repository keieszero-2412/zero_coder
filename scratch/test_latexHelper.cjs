const test = require('node:test');
const assert = require('node:assert/strict');

const input = `Lasso Regularization (L1 Regularization) là một kỹ thuật chống Overfitting bằng cách cộng thêm một thành phần phạt bằng tổng giá trị tuyệt đối của các hệ số (w_i) vào hàm mất mát (Loss Function):

$$
L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i|
$$
`;

test('production helper preserves the legacy multiline Lasso fixture', async () => {
  const { preprocessMarkdown } = await import('../src/utils/latexHelper.js');
  assert.equal(preprocessMarkdown(input), "Lasso Regularization (L1 Regularization) là một kỹ thuật chống Overfitting bằng cách cộng thêm một thành phần phạt bằng tổng giá trị tuyệt đối của các hệ số (w_i) vào hàm mất mát (Loss Function):\n\n$$\n\nL = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i|\n\n$$\n\n");
});

test('production formatter converts HTML, entities and inline code', async () => {
  const { formatProblemDescription } = await import('../src/utils/latexHelper.js');
  assert.equal(formatProblemDescription('<p><b>Hello</b> <code>x &lt; 2</code></p>'), '**Hello** `x < 2`');
});

test('production helper converts inline TeX delimiters', async () => {
  const { preprocessMarkdown } = await import('../src/utils/latexHelper.js');
  assert.equal(preprocessMarkdown('\\(x + y\\)'), '$x + y$');
});

test('production helpers accept empty input', async () => {
  const { preprocessMarkdown, formatProblemDescription } = await import('../src/utils/latexHelper.js');
  assert.equal(preprocessMarkdown(null), '');
  assert.equal(formatProblemDescription(''), '');
});
