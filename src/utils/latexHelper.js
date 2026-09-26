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

/**
 * Converts legacy HTML tags (<p>, <b>, <code>, <li>, etc.) commonly found in problem descriptions
 * into standard CommonMark/Markdown so that ReactMarkdown parses bold, code, lists, and math uniformly.
 */
export function formatProblemDescription(text) {
  if (!text || typeof text !== 'string') return '';

  let md = text;

  // 1. Replace <br> tags with newline
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // 2. Handle <pre><code>...</code></pre> and <pre>...</pre>
  md = md.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, preContent) => {
    let code = preContent;
    let lang = 'python';
    const codeMatch = preContent.match(/^<code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code>$/i);
    if (codeMatch) {
      if (codeMatch[1]) lang = codeMatch[1];
      code = codeMatch[2];
    }
    const langPrefix = code.trim().match(/^(python|py|text|json|bash|sh)\r?\n/i);
    if (langPrefix) {
      lang = langPrefix[1].toLowerCase();
      code = code.trim().slice(langPrefix[0].length);
    }
    code = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
  });

  // 3. Handle multiline <code>...</code> (convert to fenced code blocks)
  md = md.replace(/<code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code>/gi, (_, attrLang, code) => {
    if (code.includes('\n')) {
      let lang = attrLang || 'python';
      const langPrefix = code.trim().match(/^(python|py|text|json|bash|sh)\r?\n/i);
      let cleanCode = code;
      if (langPrefix) {
        lang = langPrefix[1].toLowerCase();
        cleanCode = cleanCode.trim().slice(langPrefix[0].length);
      }
      cleanCode = cleanCode
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `\n\n\`\`\`${lang}\n${cleanCode.trim()}\n\`\`\`\n\n`;
    }
    // Single line inline code: decode entities
    const cleanInline = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return `\`${cleanInline}\``;
  });

  // 4. Handle multiline single backtick blocks like `python\n...` or `...`
  md = md.replace(/(^|[^\\])`([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)`/g, (_, prefix, lang, content) => {
    const finalLang = lang ? lang.toLowerCase() : 'python';
    return `${prefix}\n\n\`\`\`${finalLang}\n${content.trim()}\n\`\`\`\n\n`;
  });

  // 5. Convert <b>, <strong> to **...**
  md = md.replace(/<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, bold) => `**${bold}**`);

  // 6. Convert <i>, <em> to *...*
  md = md.replace(/<(i|em)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, italic) => `*${italic}*`);

  // 7. Convert <li>...</li> to markdown list items
  md = md.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${item.trim()}`);

  // 8. Unwrap <ul>, <ol>
  md = md.replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n');

  // 9. Convert <p> blocks to double newlines
  md = md.replace(/<p\b[^>]*>/gi, '\n\n').replace(/<\/p>/gi, '\n\n');

  // 10. Unwrap <div> blocks
  md = md.replace(/<\/?div\b[^>]*>/gi, '\n\n');

  // 11. Ensure markdown tables missing headers have a header row
  md = md.replace(/(^|\n)([ \t]*\|[ \t]*:?-+:?[ \t]*\|[ \t]*:?-+:?[ \t]*\|[^\n]*\n)/g, (_, p1, p2) => {
    return `${p1}| Ví dụ đầu vào | Kết quả mong đợi |\n${p2}`;
  });

  // 12. Decode HTML entities for math and code readability
  md = md
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 13. Clean up excessive newlines
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  // 14. Process LaTeX math formulas if any
  return preprocessMarkdown(md);
}

