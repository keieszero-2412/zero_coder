const fs = require('fs');
const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));

function formatProblemDescription(text) {
  if (!text || typeof text !== 'string') return '';
  let md = text;
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => '`' + code + '`');
  md = md.replace(/<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, bold) => '**' + bold + '**');
  md = md.replace(/<(i|em)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, italic) => '*' + italic + '*');
  md = md.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => '\n- ' + item.trim());
  md = md.replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n');
  md = md.replace(/<p\b[^>]*>/gi, '\n\n').replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<\/?div\b[^>]*>/gi, '\n\n');
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

let count = 0;
for (const p of problems) {
  if (p.description) {
    const formatted = formatProblemDescription(p.description);
    if (formatted.length < 5) {
      console.log('Short or weird formatting:', p.id, formatted);
    }
    count++;
  }
}
console.log(`Tested ${count} problems successfully!`);
