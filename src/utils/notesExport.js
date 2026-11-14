import { getNoteImage, rasterImage } from './notesImages.js';

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const escapePdf = (value) => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/[^\x20-\x7E]/g, '?');

function inlineText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.replace(/\s+/g, ' ');
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const tag = node.tagName.toLowerCase();
  if (tag === 'br') return '\n';
  const text = [...node.childNodes].map(inlineText).join('');
  if (tag === 'a') return `[${text.trim()}](${node.getAttribute('href') || ''})`;
  if (tag === 'code') return `\`${text.trim()}\``;
  return text;
}

function walkHtml(node, blocks) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ type: 'p', text });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const tag = node.tagName.toLowerCase();
  if (tag === 'img') {
    const figure = node.closest('figure');
    const widthPx = Number(figure?.dataset.widthPx);
    const heightPx = Number(figure?.dataset.heightPx);
    blocks.push({
      type: 'image',
      id: node.dataset.imageId,
      text: node.alt || 'Image',
      width: Number(figure?.dataset.width) || 100,
      widthPx: Number.isFinite(widthPx) && widthPx >= 48 ? Math.round(widthPx) : null,
      heightPx: Number.isFinite(heightPx) && heightPx >= 32 ? Math.round(heightPx) : null,
      align: figure?.dataset.align || 'center'
    });
    return;
  }
  if (tag === 'figure' || node.querySelector('img')) {
    [...node.childNodes].forEach((child) => walkHtml(child, blocks));
    return;
  }
  if (['h1', 'h2', 'h3', 'pre', 'blockquote', 'p'].includes(tag)) {
    blocks.push({ type: tag, text: tag === 'pre' ? node.textContent.trim() : inlineText(node).trim() });
    return;
  }
  if (tag === 'li') {
    blocks.push({ type: node.parentElement?.tagName.toLowerCase() === 'ol' ? 'number' : 'bullet', text: inlineText(node).trim() });
    return;
  }
  if (tag === 'hr') {
    blocks.push({ type: 'rule', text: '' });
    return;
  }
  [...node.childNodes].forEach((child) => walkHtml(child, blocks));
}

export function htmlToBlocks(html) {
  if (typeof document === 'undefined') return [];
  const root = document.createElement('div');
  root.innerHTML = html || '';
  const blocks = [];
  [...root.childNodes].forEach((node) => walkHtml(node, blocks));
  return blocks;
}

export function noteToMarkdown(note) {
  const blocks = htmlToBlocks(note.content);
  const lines = [`# ${note.title || 'Untitled note'}`, ''];
  if (note.tags?.length) lines.push(`Tags: ${note.tags.map((tag) => `#${tag}`).join(' ')}`, '');
  if (note.source?.label || note.source?.category) {
    lines.push(`Source: ${note.source.label || note.source.category}${note.source.path ? ` (${note.source.path})` : ''}`, '');
  }
  if (note.createdAt) lines.push(`Created: ${new Date(note.createdAt).toISOString()}`, '');
  let ordered = 1;
  blocks.forEach((block) => {
    if (block.type === 'image') lines.push(`![${block.text.replace(/[\[\]\\]/g, '')}](assets/${block.id})`, '');
    else if (block.type === 'h1') lines.push(`# ${block.text}`, '');
    else if (block.type === 'h2') lines.push(`## ${block.text}`, '');
    else if (block.type === 'h3') lines.push(`### ${block.text}`, '');
    else if (block.type === 'bullet') lines.push(`- ${block.text}`);
    else if (block.type === 'number') lines.push(`${ordered++}. ${block.text}`);
    else if (block.type === 'blockquote') lines.push(`> ${block.text}`, '');
    else if (block.type === 'pre') lines.push('```', block.text, '```', '');
    else if (block.type === 'rule') lines.push('---', '');
    else if (block.text) lines.push(block.text, '');
  });
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportMarkdown(note) {
  const images = htmlToBlocks(note.content).filter((block) => block.type === 'image');
  let markdown = noteToMarkdown(note);
  const name = (note.title || 'note').replace(/[^\w\-]+/g, '-').toLowerCase();
  if (!images.length) { downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `${name}.md`); return; }
  const files = {};
  for (const image of images) {
    const record = await getNoteImage(image.id, note.ownerUid);
    const path = `assets/${image.id}.${record.extension}`;
    files[path] = new Uint8Array(await record.blob.arrayBuffer());
    markdown = markdown.replaceAll(`](assets/${image.id})`, `](${path})`);
  }
  files[`${name}.md`] = markdown;
  downloadBlob(new Blob([createZip(files)], { type: 'application/zip' }), `${name}.zip`);
}

function makePdf(note) {
  const text = noteToMarkdown(note).replace(/\r/g, '');
  const lines = text.split('\n').flatMap((line) => {
    if (!line) return [''];
    const chunks = [];
    for (let i = 0; i < line.length; i += 92) chunks.push(line.slice(i, i + 92));
    return chunks;
  });
  const pageLines = 48;
  const pages = [];
  for (let i = 0; i < lines.length || !pages.length; i += pageLines) pages.push(lines.slice(i, i + pageLines));
  const objects = [];
  const pageIds = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [] /Count 0 >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  pages.forEach((page) => {
    const content = ['BT', '/F1 11 Tf', '50 760 Td', '14 TL', ...page.map((line) => `(${escapePdf(line)}) Tj T*`), 'ET'].join('\n');
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

async function makeImagePdf(note) {
  const encoder = new TextEncoder();
  const objects = [encoder.encode('<< /Type /Catalog /Pages 2 0 R >>'), null, encoder.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')];
  const pageIds = [];
  let commands = [];
  let resources = [];
  let y = 750;
  const add = (bytes) => { objects.push(typeof bytes === 'string' ? encoder.encode(bytes) : bytes); return objects.length; };
  const flush = () => {
    const content = commands.join('\n');
    const contentId = add(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> /XObject << ${resources.join(' ')} >> >> /Contents ${contentId} 0 R >>`));
    commands = []; resources = []; y = 750;
  };
  const textLine = (text, size = 11) => {
    if (y < 55) flush();
    commands.push(`BT /F1 ${size} Tf 50 ${y} Td (${escapePdf(text)}) Tj ET`);
    y -= size + 6;
  };
  textLine(note.title || 'Untitled note', 18);
  if (note.tags?.length) textLine(`Tags: ${note.tags.join(', ')}`);
  if (note.source) textLine(`Source: ${note.source.label || note.source.category || ''}`);
  for (const block of htmlToBlocks(note.content)) {
    if (block.type === 'image') {
      const image = await rasterImage(await getNoteImage(block.id, note.ownerUid), 'image/jpeg');
      const targetWidth = 512 * block.width / 100;
      const ratio = block.widthPx && block.heightPx ? (block.heightPx / block.widthPx) : (image.height / image.width);
      const scale = Math.min(targetWidth / image.width, 620 / Math.max(1, image.width * ratio));
      const width = image.width * scale;
      const height = Math.min(620, width * ratio);
      if (y - height < 50) flush();
      const id = add(joinBytes([encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`), image.bytes, encoder.encode('\nendstream')]));
      const name = `Im${id}`;
      resources.push(`/${name} ${id} 0 R`);
      const x = block.align === 'left' ? 50 : block.align === 'right' ? 562 - width : (612 - width) / 2;
      commands.push(`q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${(y - height).toFixed(2)} cm /${name} Do Q`);
      y -= height + 16;
    } else {
      const size = block.type === 'h1' ? 17 : block.type === 'h2' ? 15 : block.type === 'h3' ? 13 : 11;
      const prefix = block.type === 'bullet' ? '- ' : block.type === 'number' ? '• ' : '';
      for (const line of `${prefix}${block.text}`.split('\n')) {
        for (let i = 0; i < Math.max(1, line.length); i += 85) textLine(line.slice(i, i + 85), size);
      }
      y -= 5;
    }
  }
  if (commands.length || !pageIds.length) flush();
  objects[1] = encoder.encode(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  const chunks = [encoder.encode('%PDF-1.4\n')];
  const offsets = [0];
  let offset = chunks[0].length;
  objects.forEach((object, i) => {
    offsets.push(offset);
    const chunk = joinBytes([encoder.encode(`${i + 1} 0 obj\n`), object, encoder.encode('\nendobj\n')]);
    chunks.push(chunk); offset += chunk.length;
  });
  chunks.push(encoder.encode(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((value) => `${String(value).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`));
  return new Blob(chunks, { type: 'application/pdf' });
}

export async function exportPdf(note) {
  const blob = htmlToBlocks(note.content).some((block) => block.type === 'image') ? await makeImagePdf(note) : makePdf(note);
  downloadBlob(blob, `${(note.title || 'note').replace(/[^\w\-]+/g, '-').toLowerCase()}.pdf`);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const u16 = (value) => new Uint8Array([value & 255, (value >>> 8) & 255]);
const u32 = (value) => new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
const joinBytes = (parts) => { const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let offset = 0; parts.forEach((part) => { out.set(part, offset); offset += part.length; }); return out; };

function createZip(files) {
  const encoder = new TextEncoder();
  const locals = [], centrals = [];
  let offset = 0;
  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = content instanceof Uint8Array ? content : encoder.encode(content);
    const crc = crc32(data);
    const local = joinBytes([new Uint8Array([80, 75, 3, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0]), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data]);
    locals.push(local);
    centrals.push(joinBytes([new Uint8Array([80, 75, 1, 2, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0]), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes]));
    offset += local.length;
  });
  const central = joinBytes(centrals);
  return joinBytes([...locals, central, new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0]), u16(centrals.length), u16(centrals.length), u32(central.length), u32(offset), u16(0)]);
}

function docxXml(note, images = []) {
  const blocks = htmlToBlocks(note.content);
  let imageIndex = 0;
  const paragraphs = [`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${escapeXml(note.title || 'Untitled note')}</w:t></w:r></w:p>`];
  if (note.tags?.length) paragraphs.push(`<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Tags: ${escapeXml(note.tags.join(', '))}</w:t></w:r></w:p>`);
  if (note.source?.label || note.source?.category) paragraphs.push(`<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Source: ${escapeXml(note.source.label || note.source.category)}</w:t></w:r></w:p>`);
  if (note.createdAt) paragraphs.push(`<w:p><w:r><w:t>Created: ${escapeXml(new Date(note.createdAt).toISOString())}</w:t></w:r></w:p>`);
  blocks.forEach((block) => {
    if (block.type === 'image') {
      const index = imageIndex++;
      const image = images[index];
      const ratio = block.widthPx && block.heightPx ? (block.heightPx / block.widthPx) : (image.height / image.width);
      const width = Math.round(Math.min(5486400 * Math.min(100, block.width) / 100, 7772400 / Math.max(0.1, ratio)));
      const height = Math.round(width * ratio);
      paragraphs.push(`<w:p><w:pPr><w:jc w:val="${block.align}"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${width}" cy="${height}"/><wp:docPr id="${index + 1}" name="Image ${index + 1}" descr="${escapeXml(block.text)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${index + 1}" name="Image ${index + 1}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="image${index + 1}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
      return;
    }
    const style = block.type.startsWith('h') ? `Heading${block.type.slice(1)}` : block.type === 'bullet' ? 'ListBullet' : block.type === 'number' ? 'ListNumber' : block.type === 'pre' ? 'Code' : 'Normal';
    paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(block.text || ' ')}</w:t></w:r></w:p>`);
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.join('')}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;
}

export async function exportDocx(note) {
  const images = [];
  for (const block of htmlToBlocks(note.content).filter((item) => item.type === 'image')) {
    images.push({ id: block.id, ...await rasterImage(await getNoteImage(block.id, note.ownerUid)) });
  }
  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': docxXml(note, images)
  };
  files['[Content_Types].xml'] = files['[Content_Types].xml'].replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>');
  files['word/_rels/document.xml.rels'] = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images.map((image, index) => `<Relationship Id="image${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${index + 1}.png"/>`).join('')}</Relationships>`;
  images.forEach((image, index) => { files[`word/media/image${index + 1}.png`] = image.bytes; });
  downloadBlob(new Blob([createZip(files)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `${(note.title || 'note').replace(/[^\w\-]+/g, '-').toLowerCase()}.docx`);
}
