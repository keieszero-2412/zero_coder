const str = 'test\n$$math$$';
const res = str.replace(/(<(?:\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+[^>]*)>|[^\n])\s*\n\s*(\$\$[^\n$]+\$\$)/g, (_, p1, p2) => {
  console.log('p1:', p1, 'p2:', p2);
  return `${p1}\n\n${p2}\n\n`;
});
console.log(res);
