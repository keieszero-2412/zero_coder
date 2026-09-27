const { preprocessMarkdown, formatProblemDescription } = require('./src/utils/latexHelper.js');

const input = `Lasso Regularization (L1 Regularization) là một kỹ thuật chống Overfitting bằng cách cộng thêm một thành phần phạt bằng tổng giá trị tuyệt đối của các hệ số (w_i) vào hàm mất mát (Loss Function):

$$
L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i|
$$
`;

console.log(preprocessMarkdown(input));
