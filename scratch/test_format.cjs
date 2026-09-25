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
  md = md.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

const p1 = problems.find(x => x.id === 'ftds_1');
console.log('--- FTDS_1 ---');
console.log(formatProblemDescription(p1.description));

const p2 = problems.find(x => x.id === 'mock3_4');
console.log('\n--- MOCK3_4 ---');
console.log(formatProblemDescription(p2.description));

const p3 = problems.find(x => x.description && x.description.includes('best_trade'));
console.log('\n--- BEST_TRADE ---');
console.log(formatProblemDescription(p3.description));
