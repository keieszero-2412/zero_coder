require('@babel/register')({ presets: ['@babel/preset-env', '@babel/preset-react'] });
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default;
const remarkMath = require('remark-math').default;
const rehypeKatex = require('rehype-katex').default;
const { preprocessMarkdown } = require('./src/utils/latexHelper.js');

const displayedContent = "Lasso Regularization (L1) là kỹ thuật thêm vào hàm mất mát một hình phạt bằng tổng giá trị tuyệt đối của các hệ số:\\n\\n$$ L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i| $$";
const processed = preprocessMarkdown(displayedContent);

const element = React.createElement(ReactMarkdown, {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex]
}, processed);

const html = ReactDOMServer.renderToString(element);
console.log(html);
