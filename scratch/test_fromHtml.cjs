const {fromHtmlIsomorphic} = require('hast-util-from-html-isomorphic');
const ast = fromHtmlIsomorphic('<span class="katex-error">\\undefined</span>', {fragment: true});
console.log(JSON.stringify(ast, null, 2));
