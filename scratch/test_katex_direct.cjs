const katex = require('katex');

try {
  const html = katex.renderToString("L = \\text{Loss} + \\lambda \\sum_{i=1}^n |w_i|", {
    throwOnError: false
  });
  console.log(html);
} catch (e) {
  console.error("Error:", e);
}
