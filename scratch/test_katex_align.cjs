const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createElement } = React;

async function run() {
  const { default: ReactMarkdown } = await import('react-markdown');
  const { default: remarkMath } = await import('remark-math');
  const { default: rehypeKatex } = await import('rehype-katex');

  const markdown = "Here is some math: $$ \\begin{align} L &= 1 \\end{align} $$";
  
  const element = createElement(ReactMarkdown, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }, markdown);

  const html = renderToStaticMarkup(element);
  console.log(html);
}

run().catch(console.error);
