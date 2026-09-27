const {unified} = require('unified');
const remarkParse = require('remark-parse').default;
const remarkMath = require('remark-math').default;
const remarkRehype = require('remark-rehype').default;
const rehypeKatex = require('rehype-katex').default;

const markdown = '$$ L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i| $$';

const tree = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .processSync(markdown);

console.log(String(tree));
