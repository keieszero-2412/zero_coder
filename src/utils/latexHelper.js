/**
 * Helper utility to normalize and preprocess LaTeX and Markdown content
 * so that remark-math, rehype-katex, and KaTeX can render math cleanly
 * without leaving raw plaintext or unparsed tags.
 */

export function preprocessMarkdown(text) {
  if (!text || typeof text !== 'string') return text || '';

  let cleaned = text;

  // 1. Convert display math \[ ... \] to display math $$ ... $$
  cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
    return `\n\n$$\n${eq.trim()}\n$$\n\n`;
  });

  // 2. Convert inline math \( ... \) to $...$
  cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => {
    return `$${eq.trim()}$`;
  });

  // 3. Convert \begin{equation} ... \end{equation} to $$ ... $$
  cleaned = cleaned.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, eq) => {
    return `\n\n$$\n${eq.trim()}\n$$\n\n`;
  });

  // 4. Ensure HTML tags or text lines directly before $$ have a blank line
  // CommonMark spec requires a blank line after an HTML block before parsing markdown blocks
  cleaned = cleaned.replace(/(<(?:\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+[^>]*)>|[^\n])\s*\n\s*\$\$/g, (_, p1) => {
    return `${p1}\n\n$$\n`;
  });

  // 5. Ensure $$ at the end of a math block has a blank line after it if followed by text or HTML
  cleaned = cleaned.replace(/\$\$\s*\n\s*([^\n$])/g, (_, p1) => {
    return `$$\n\n${p1}`;
  });

  // 6. Handle single-line $$ formula $$ preceded by text/HTML
  cleaned = cleaned.replace(/(<(?:\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+[^>]*)>|[^\n])\s*\n\s*(\$\$[^\n$]+\$\$)/g, (_, p1, p2) => {
    return `${p1}\n\n${p2}\n\n`;
  });

  return cleaned;
}
