import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, increment } from 'firebase/firestore';

export const EMPTY_CONTENT = '<p><br></p>';
export const STORAGE_PREFIX = 'zerocoder_notes_';
const ALLOWED_TAGS = new Set(['P', 'BR', 'H1', 'H2', 'H3', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'DEL', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'HR', 'FIGURE', 'FIGCAPTION', 'IMG']);
const BLOCK_FORMAT_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE']);

export function sanitizeNoteHtml(value) {
  if (typeof document === 'undefined') {
    if (!value) return EMPTY_CONTENT;
    return String(value)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\u200B/g, '');
  }
  const parser = new DOMParser();
  const source = parser.parseFromString(String(value || EMPTY_CONTENT), 'text/html');
  const clean = document.createElement('div');

  const walk = (node, parent) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const cleanedText = (node.nodeValue || '').replace(/\u200B/g, '');
      if (cleanedText) {
        parent.appendChild(document.createTextNode(cleanedText));
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const rawTag = node.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(rawTag)) {
      [...node.childNodes].forEach((child) => walk(child, parent));
      return;
    }
    const tag = (rawTag === 'STRIKE' || rawTag === 'DEL') ? 'S' : rawTag;
    const next = document.createElement(tag.toLowerCase());
    if (tag === 'IMG') {
      const id = node.getAttribute('data-image-id');
      if (!/^([a-f0-9-]{36}|[a-f0-9]{64})$/i.test(id || '')) return;
      next.setAttribute('data-image-id', id);
      next.setAttribute('alt', (node.getAttribute('alt') || 'Note image').slice(0, 500));
      const imgWidth = Number(node.getAttribute('width'));
      if (Number.isFinite(imgWidth) && imgWidth >= 32 && imgWidth <= 2400) {
        next.setAttribute('width', String(Math.round(imgWidth)));
      }
      const imgHeight = Number(node.getAttribute('height'));
      if (Number.isFinite(imgHeight) && imgHeight >= 32 && imgHeight <= 2400) {
        next.setAttribute('height', String(Math.round(imgHeight)));
      }
      const figureHeightPx = parent.tagName === 'FIGURE' ? Number(parent.getAttribute('data-height-px')) : NaN;
      if (Number.isFinite(figureHeightPx) && figureHeightPx >= 32 && figureHeightPx <= 2400) {
        next.style.height = `${Math.round(figureHeightPx)}px`;
        next.style.width = '100%';
        next.style.objectFit = 'fill';
      }
    }
    if (tag === 'FIGURE') {
      next.setAttribute('contenteditable', 'false');
      const align = node.getAttribute('data-align');
      next.setAttribute('data-align', ['left', 'center', 'right'].includes(align) ? align : 'center');
      const width = Math.max(10, Math.min(100, Math.round(Number(node.getAttribute('data-width')) || 100)));
      next.setAttribute('data-width', String(width));
      const rawWidthPx = Number(node.getAttribute('data-width-px'));
      const rawHeightPx = Number(node.getAttribute('data-height-px'));
      if (Number.isFinite(rawWidthPx) && rawWidthPx >= 48 && rawWidthPx <= 2400) {
        const clampedWidthPx = Math.round(rawWidthPx);
        next.setAttribute('data-width-px', String(clampedWidthPx));
        next.style.width = `${clampedWidthPx}px`;
        next.style.maxWidth = '100%';
      } else {
        next.style.width = `${width}%`;
        next.style.maxWidth = '100%';
      }
      if (Number.isFinite(rawHeightPx) && rawHeightPx >= 32 && rawHeightPx <= 2400) {
        next.setAttribute('data-height-px', String(Math.round(rawHeightPx)));
      }
    }
    if (tag === 'A') {
      const href = (node.getAttribute('href') || '').trim();
      if (/^(https?:|mailto:)/i.test(href)) {
        next.setAttribute('href', href);
        next.setAttribute('target', '_blank');
        next.setAttribute('rel', 'noopener noreferrer');
      }
    }
    [...node.childNodes].forEach((child) => walk(child, next));
    if (tag === 'CODE' && !next.textContent && next.children.length === 0) return;
    parent.appendChild(next);
  };

  [...source.body.childNodes].forEach((node) => walk(node, clean));
  return clean.innerHTML || EMPTY_CONTENT;
}

function escapeHtmlText(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitTrailingUrlPunctuation(rawUrl) {
  let url = String(rawUrl || '');
  let trailing = '';
  while (url.length > 0) {
    const last = url[url.length - 1];
    if (/[.,;:!?]/.test(last)) {
      trailing = last + trailing;
      url = url.slice(0, -1);
    } else if (last === ')' && (url.match(/\(/g) || []).length < (url.match(/\)/g) || []).length) {
      trailing = last + trailing;
      url = url.slice(0, -1);
    } else if (last === ']' && (url.match(/\[/g) || []).length < (url.match(/\]/g) || []).length) {
      trailing = last + trailing;
      url = url.slice(0, -1);
    } else {
      break;
    }
  }
  return { url, trailing };
}

export function isValidNoteUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed || /\s/.test(trimmed)) return '';
  if (!/^(https?:\/\/|mailto:)/i.test(trimmed)) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      if (!parsed.hostname) return '';
      return trimmed;
    }
    if (parsed.protocol === 'mailto:') {
      const addr = parsed.pathname || '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr) ? trimmed : '';
    }
    return '';
  } catch {
    return '';
  }
}

export function createLinkHtml(href, label = href) {
  const valid = isValidNoteUrl(href);
  if (!valid) return escapeHtmlText(label);
  return `<a href="${escapeHtmlText(valid)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(label)}</a>`;
}

const URL_FINDER_REGEX = /(https?:\/\/[^\s<>"'`]+|mailto:[^\s<>"'`@]+@[^\s<>"'`]+\.[^\s<>"'`]+)/gi;

export function linkifyPlainTextToHtml(text) {
  const normalized = String(text || '').replace(/\r\n?/g, '\n');
  let urlCount = 0;
  const htmlLines = normalized.split('\n').map((line) => {
    let result = '';
    let lastIndex = 0;
    URL_FINDER_REGEX.lastIndex = 0;
    let match;
    while ((match = URL_FINDER_REGEX.exec(line)) !== null) {
      const prefix = line.slice(lastIndex, match.index);
      if (prefix) result += escapeHtmlText(prefix);
      const { url, trailing } = splitTrailingUrlPunctuation(match[0]);
      const valid = isValidNoteUrl(url);
      if (valid) {
        result += createLinkHtml(valid, url);
        urlCount += 1;
      } else {
        result += escapeHtmlText(url);
      }
      if (trailing) result += escapeHtmlText(trailing);
      lastIndex = match.index + match[0].length;
    }
    result += escapeHtmlText(line.slice(lastIndex));
    return result;
  });
  return { html: htmlLines.join('<br>'), urlCount };
}

export function linkifyHtmlFragment(rawHtml) {
  if (typeof document === 'undefined') {
    const sanitized = sanitizeNoteHtml(rawHtml);
    return { html: sanitized, urlCount: 0 };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(rawHtml || ''), 'text/html');
  let urlCount = 0;
  const skipTags = new Set(['A', 'CODE', 'PRE', 'SCRIPT', 'STYLE']);
  const textNodes = [];

  const collect = (node, insideSkipped) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!insideSkipped && node.nodeValue) textNodes.push(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const nextSkipped = insideSkipped || skipTags.has(node.tagName.toUpperCase());
    [...node.childNodes].forEach((child) => collect(child, nextSkipped));
  };
  collect(doc.body, false);

  for (const textNode of textNodes) {
    const value = textNode.nodeValue || '';
    URL_FINDER_REGEX.lastIndex = 0;
    let match = URL_FINDER_REGEX.exec(value);
    if (!match) continue;

    URL_FINDER_REGEX.lastIndex = 0;
    const frag = doc.createDocumentFragment();
    let lastIndex = 0;
    let replacedAny = false;
    while ((match = URL_FINDER_REGEX.exec(value)) !== null) {
      const before = value.slice(lastIndex, match.index);
      if (before) frag.appendChild(doc.createTextNode(before));
      const { url, trailing } = splitTrailingUrlPunctuation(match[0]);
      const valid = isValidNoteUrl(url);
      if (valid) {
        const anchor = doc.createElement('a');
        anchor.setAttribute('href', valid);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
        anchor.textContent = url;
        frag.appendChild(anchor);
        urlCount += 1;
        replacedAny = true;
      } else {
        frag.appendChild(doc.createTextNode(url));
      }
      if (trailing) frag.appendChild(doc.createTextNode(trailing));
      lastIndex = match.index + match[0].length;
    }
    const tail = value.slice(lastIndex);
    if (tail) frag.appendChild(doc.createTextNode(tail));
    if (replacedAny && textNode.parentNode) {
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  return { html: sanitizeNoteHtml(doc.body.innerHTML), urlCount };
}

function getEditorRange(editor, savedRange = null) {
  if (!editor || typeof window === 'undefined') return null;
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const current = selection.getRangeAt(0);
    if (editor.contains(current.commonAncestorContainer)) {
      return current;
    }
  }
  if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    return savedRange;
  }
  return null;
}

function setEditorRange(range) {
  if (!range || typeof window === 'undefined') return;
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

function findClosestAncestorTag(node, editor, tagNames) {
  let current = node?.nodeType === 3 ? node.parentElement : node;
  while (current && current !== editor) {
    if (tagNames.has(current.tagName?.toUpperCase())) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function findEnclosingBlock(node, editor) {
  const blockTags = new Set(['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'DIV', 'LI']);
  let current = node?.nodeType === 3 ? node.parentElement : node;
  let candidate = null;
  while (current && current !== editor) {
    if (blockTags.has(current.tagName?.toUpperCase())) {
      candidate = current;
      if (current.parentElement === editor || current.tagName.toUpperCase() === 'LI') {
        return current;
      }
    }
    current = current.parentElement;
  }
  return candidate;
}

function collectRangeBlocks(editor, range) {
  const blocks = [];
  const pushUnique = (el) => {
    if (el && el !== editor && !blocks.includes(el)) blocks.push(el);
  };

  if (range.collapsed) {
    let targetNode = range.startContainer;
    if (targetNode === editor) {
      targetNode = editor.childNodes[range.startOffset] || editor.childNodes[Math.max(0, range.startOffset - 1)] || null;
    }
    const block = targetNode ? findEnclosingBlock(targetNode, editor) : null;
    if (block) pushUnique(block);
    return blocks;
  }

  const startBlock = findEnclosingBlock(range.startContainer, editor);
  const endBlock = findEnclosingBlock(range.endContainer, editor);
  if (startBlock) pushUnique(startBlock);

  for (const child of [...editor.children]) {
    if (typeof range.intersectsNode === 'function' && range.intersectsNode(child)) {
      if (['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'DIV'].includes(child.tagName.toUpperCase())) {
        pushUnique(child);
      } else if (child.tagName.toUpperCase() === 'UL' || child.tagName.toUpperCase() === 'OL') {
        for (const li of [...child.querySelectorAll('li')]) {
          if (range.intersectsNode(li)) pushUnique(li);
        }
      }
    }
  }
  if (endBlock) pushUnique(endBlock);
  return blocks;
}

export function applyBlockFormatToEditor(editor, requestedTag, savedRange = null, { toggleToParagraph = false } = {}) {
  if (!editor || typeof document === 'undefined') return 'p';
  const normalized = String(requestedTag || 'p').replace(/[<>]/g, '').toLowerCase();
  const upperTag = normalized.toUpperCase();
  const safeTag = BLOCK_FORMAT_TAGS.has(upperTag) ? normalized : 'p';

  let range = getEditorRange(editor, savedRange);
  if (!range) {
    range = document.createRange();
    const target = editor.firstElementChild || editor;
    range.selectNodeContents(target);
    range.collapse(false);
    setEditorRange(range);
  }

  let blocks = collectRangeBlocks(editor, range);
  if (blocks.length === 0) {
    // Wrap inline/text content at caret into a block element
    const p = document.createElement(safeTag);
    const bareNodes = [...editor.childNodes].filter((n) => n.nodeType === 3 || !['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'FIGURE', 'HR'].includes(n.tagName?.toUpperCase()));
    if (bareNodes.length > 0) {
      bareNodes[0].parentNode.insertBefore(p, bareNodes[0]);
      bareNodes.forEach((n) => p.appendChild(n));
    } else {
      p.innerHTML = '<br>';
      editor.appendChild(p);
    }
    const nextRange = document.createRange();
    nextRange.selectNodeContents(p);
    nextRange.collapse(false);
    setEditorRange(nextRange);
    return safeTag;
  }

  const allSame = toggleToParagraph && blocks.every((b) => b.tagName.toLowerCase() === safeTag);
  const finalTag = allSame ? 'p' : safeTag;

  const replacementBlocks = [];
  for (const block of blocks) {
    if (block.tagName.toLowerCase() === 'li') {
      const list = block.closest('ul, ol');
      const nextEl = document.createElement(finalTag);
      while (block.firstChild) nextEl.appendChild(block.firstChild);
      if (!nextEl.firstChild) nextEl.innerHTML = '<br>';
      if (list && list.parentNode) {
        list.parentNode.insertBefore(nextEl, list.nextSibling);
        block.remove();
        if (list.children.length === 0) list.remove();
      }
      replacementBlocks.push(nextEl);
      continue;
    }

    if (block.tagName.toLowerCase() === finalTag) {
      replacementBlocks.push(block);
      continue;
    }

    const nextEl = document.createElement(finalTag);
    while (block.firstChild) nextEl.appendChild(block.firstChild);
    if (!nextEl.firstChild) nextEl.innerHTML = '<br>';
    block.parentNode.replaceChild(nextEl, block);
    replacementBlocks.push(nextEl);
  }

  if (replacementBlocks.length > 0) {
    const newRange = document.createRange();
    const first = replacementBlocks[0];
    const last = replacementBlocks[replacementBlocks.length - 1];
    if (range.collapsed) {
      newRange.selectNodeContents(last);
      newRange.collapse(false);
    } else {
      newRange.setStart(first, 0);
      newRange.setEnd(last, last.childNodes.length);
    }
    setEditorRange(newRange);
  }
  return finalTag;
}

export function toggleInlineCodeInEditor(editor, savedRange = null) {
  if (!editor || typeof document === 'undefined') return false;
  let range = getEditorRange(editor, savedRange);
  if (!range) return false;

  const startCode = findClosestAncestorTag(range.startContainer, editor, new Set(['CODE']));
  const endCode = findClosestAncestorTag(range.endContainer, editor, new Set(['CODE']));
  if (startCode && (!endCode || startCode === endCode) && !startCode.closest('pre')) {
    const parent = startCode.parentNode;
    const textContent = startCode.textContent?.replace(/\u200B/g, '') || '';
    const textNode = document.createTextNode(textContent);
    parent.replaceChild(textNode, startCode);
    const nextRange = document.createRange();
    nextRange.setStart(textNode, textContent.length);
    nextRange.setEnd(textNode, textContent.length);
    setEditorRange(nextRange);
    return false;
  }

  const codeEl = document.createElement('code');
  if (range.collapsed) {
    const zwsp = document.createTextNode('\u200B');
    codeEl.appendChild(zwsp);
    range.insertNode(codeEl);
    const nextRange = document.createRange();
    nextRange.setStart(zwsp, 1);
    nextRange.setEnd(zwsp, 1);
    setEditorRange(nextRange);
    return true;
  }

  const fragment = range.extractContents();
  codeEl.appendChild(fragment);
  range.insertNode(codeEl);
  const nextRange = document.createRange();
  nextRange.selectNodeContents(codeEl);
  setEditorRange(nextRange);
  return true;
}

export function toggleInlineTagInEditor(editor, command, tagAliases, savedRange = null) {
  if (!editor || typeof document === 'undefined') return false;
  let range = getEditorRange(editor, savedRange);
  if (!range) {
    const fallback = document.createRange();
    const target = editor.firstElementChild || editor;
    fallback.selectNodeContents(target);
    fallback.collapse(false);
    setEditorRange(fallback);
    range = fallback;
  }

  const beforeHtml = editor.innerHTML;
  if (typeof document.execCommand === 'function') {
    try {
      document.execCommand(command, false);
      if (editor.innerHTML !== beforeHtml || range.collapsed) {
        return true;
      }
    } catch {
      // Fall through to deterministic DOM toggle for environments without execCommand
    }
  }

  const aliasSet = new Set(tagAliases.map((t) => t.toUpperCase()));
  const canonical = tagAliases[0].toLowerCase();
  const startMatch = findClosestAncestorTag(range.startContainer, editor, aliasSet);
  const endMatch = findClosestAncestorTag(range.endContainer, editor, aliasSet);

  if (startMatch && (!endMatch || startMatch === endMatch)) {
    const parent = startMatch.parentNode;
    const textContent = startMatch.textContent || '';
    const textNode = document.createTextNode(textContent);
    parent.replaceChild(textNode, startMatch);
    const nextRange = document.createRange();
    if (range.collapsed) {
      nextRange.setStart(textNode, textContent.length);
      nextRange.collapse(true);
    } else {
      nextRange.selectNodeContents(textNode);
    }
    setEditorRange(nextRange);
    return false;
  }

  const wrapper = document.createElement(canonical);
  if (range.collapsed) {
    const zwsp = document.createTextNode('\u200B');
    wrapper.appendChild(zwsp);
    range.insertNode(wrapper);
    const nextRange = document.createRange();
    nextRange.setStart(zwsp, 1);
    nextRange.setEnd(zwsp, 1);
    setEditorRange(nextRange);
    return true;
  }

  wrapper.appendChild(range.extractContents());
  range.insertNode(wrapper);
  const nextRange = document.createRange();
  nextRange.selectNodeContents(wrapper);
  setEditorRange(nextRange);
  return true;
}

export function computeEditorToolbarState(editor, range = null) {
  const emptyState = {
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    inlineCode: false,
    unorderedList: false,
    orderedList: false,
    blockquote: false,
    codeBlock: false,
    block: 'p'
  };
  if (!editor || typeof document === 'undefined') return emptyState;

  let activeRange = range;
  if (!activeRange && typeof window !== 'undefined') {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const candidate = sel.getRangeAt(0);
      if (editor.contains(candidate.commonAncestorContainer)) {
        activeRange = candidate;
      }
    }
  }
  if (!activeRange || !editor.contains(activeRange.commonAncestorContainer)) {
    return emptyState;
  }

  const safeQueryState = (cmd) => {
    if (typeof document.queryCommandState !== 'function') return false;
    try {
      return Boolean(document.queryCommandState(cmd));
    } catch {
      return false;
    }
  };

  let anchorNode = activeRange.startContainer;
  if (anchorNode === editor && editor.childNodes.length > 0) {
    anchorNode = editor.childNodes[Math.min(activeRange.startOffset, editor.childNodes.length - 1)];
  }
  const endNode = activeRange.collapsed
    ? anchorNode
    : (activeRange.endContainer === editor && editor.childNodes.length > 0
      ? editor.childNodes[Math.max(0, Math.min(activeRange.endOffset - 1, editor.childNodes.length - 1))]
      : activeRange.endContainer);

  const leafNodes = [];
  if (!activeRange.collapsed && typeof document.createTreeWalker === 'function') {
    const root = activeRange.commonAncestorContainer;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current;
    while ((current = walker.nextNode())) {
      if (!current.nodeValue?.trim()) continue;
      if (typeof activeRange.intersectsNode === 'function' ? activeRange.intersectsNode(current) : true) {
        leafNodes.push(current);
      }
    }
  }
  const checkNodes = leafNodes.length > 0 ? leafNodes : [anchorNode, endNode].filter(Boolean);
  const allHaveTag = (tagSet) => checkNodes.length > 0 && checkNodes.every((n) => Boolean(findClosestAncestorTag(n, editor, tagSet)));
  const anyHasTag = (tagSet) => checkNodes.some((n) => Boolean(findClosestAncestorTag(n, editor, tagSet)));

  const codeBlock = anyHasTag(new Set(['PRE']));
  const blockquote = anyHasTag(new Set(['BLOCKQUOTE']));
  const unorderedList = anyHasTag(new Set(['UL']));
  const orderedList = anyHasTag(new Set(['OL']));

  let block = 'p';
  const headingEl = findClosestAncestorTag(anchorNode, editor, new Set(['H1', 'H2', 'H3', 'P']));
  if (headingEl && ['H1', 'H2', 'H3'].includes(headingEl.tagName.toUpperCase())) {
    block = headingEl.tagName.toLowerCase();
  } else if (checkNodes.length > 0) {
    const firstHeading = findClosestAncestorTag(checkNodes[0], editor, new Set(['H1', 'H2', 'H3']));
    if (firstHeading && checkNodes.every((n) => findClosestAncestorTag(n, editor, new Set(['H1', 'H2', 'H3'])) === firstHeading)) {
      block = firstHeading.tagName.toLowerCase();
    }
  }

  return {
    bold: allHaveTag(new Set(['B', 'STRONG'])) || safeQueryState('bold'),
    italic: allHaveTag(new Set(['I', 'EM'])) || safeQueryState('italic'),
    underline: allHaveTag(new Set(['U'])) || safeQueryState('underline'),
    strikeThrough: allHaveTag(new Set(['S', 'STRIKE', 'DEL'])) || safeQueryState('strikeThrough'),
    inlineCode: allHaveTag(new Set(['CODE'])) && !codeBlock,
    unorderedList: unorderedList || safeQueryState('insertUnorderedList'),
    orderedList: orderedList || safeQueryState('insertOrderedList'),
    blockquote,
    codeBlock,
    block
  };
}

export function extractImageIds(content) {
  if (!content || typeof content !== 'string') return [];
  const ids = [];
  const regex = /data-image-id=["']([a-f0-9-]{36}|[a-f0-9]{64})["']/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!ids.includes(match[1])) ids.push(match[1]);
  }
  return ids.slice(0, 200);
}

export function normalizeNote(note) {
  const now = Date.now();
  const content = sanitizeNoteHtml(note.content || EMPTY_CONTENT);
  return {
    id: String(note.id || `note-${now}-${Math.random().toString(36).slice(2, 8)}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
    title: typeof note.title === 'string' ? note.title.slice(0, 500) : 'New note',
    content,
    createdAt: Number(note.createdAt) || now,
    updatedAt: Number(note.updatedAt) || Number(note.createdAt) || now,
    tags: Array.isArray(note.tags) ? [...new Set(note.tags.filter(Boolean).map((t) => String(t).trim().slice(0, 32)))].slice(0, 20) : [],
    source: note.source && typeof note.source === 'object' ? { ...note.source } : null,
    revision: Number.isInteger(note.revision) && note.revision >= 1 ? note.revision : 1,
    imageIds: Array.isArray(note.imageIds) ? note.imageIds.slice(0, 200) : extractImageIds(content),
    deleted: Boolean(note.deleted),
    ...(note.conflictOf ? { conflictOf: String(note.conflictOf).slice(0, 128) } : {}),
    ...(note.migrationId ? { migrationId: String(note.migrationId).slice(0, 128) } : {})
  };
}

export function makeNote() {
  const now = Date.now();
  return normalizeNote({
    id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'New note',
    content: EMPTY_CONTENT,
    createdAt: now,
    updatedAt: now,
    tags: [],
    source: null,
    revision: 1,
    imageIds: []
  });
}

export function noteStorageKey(uid) {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

export function loadLocalNotes(uid) {
  try {
    const raw = localStorage.getItem(noteStorageKey(uid));
    const notes = raw ? JSON.parse(raw) : [];
    return Array.isArray(notes) && notes.length ? notes.map(normalizeNote).filter((n) => !n.deleted) : [makeNote()];
  } catch {
    return [makeNote()];
  }
}

export function saveLocalNotes(uid, notes) {
  try {
    localStorage.setItem(noteStorageKey(uid), JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes locally:', err);
  }
}

const noteSyncQueues = new Map();
const sessionSyncedState = new Map();

function enqueueNoteSync(key, task) {
  const previous = noteSyncQueues.get(key) || Promise.resolve();
  const next = previous.catch(() => { }).then(task);
  const tracked = next.finally(() => {
    if (noteSyncQueues.get(key) === tracked) {
      noteSyncQueues.delete(key);
    }
  });
  noteSyncQueues.set(key, tracked);
  return next;
}

export function syncNoteToFirestore(db, uid, note) {
  if (!uid || uid === 'guest' || !db || !note?.id) return Promise.resolve(note);
  const syncKey = `${uid}:${note.id}`;
  return enqueueNoteSync(syncKey, async () => {
    const imageIds = extractImageIds(note.content).slice(0, 200);
    const noteRef = doc(db, 'users', uid, 'notes', note.id);
    const snap = await getDoc(noteRef);
    const existing = snap.exists() ? snap.data() : null;

    const payloadTitle = (note.title || 'New note').slice(0, 500);
    const payloadContent = (note.content || EMPTY_CONTENT).slice(0, 800000);
    const payloadTags = Array.isArray(note.tags) ? note.tags.slice(0, 20) : [];
    const payloadSource = note.source || null;
    const sessionSync = sessionSyncedState.get(syncKey);

    if (existing && !existing.deleted) {
      const sameContent =
        (existing.title || 'New note') === payloadTitle &&
        (existing.content || EMPTY_CONTENT) === payloadContent &&
        JSON.stringify(existing.tags || []) === JSON.stringify(payloadTags) &&
        JSON.stringify(existing.source || null) === JSON.stringify(payloadSource) &&
        JSON.stringify(existing.imageIds || []) === JSON.stringify(imageIds);
      if (sameContent) {
        sessionSyncedState.set(syncKey, {
          revision: Number(existing.revision) || 1,
          updatedAt: Number(existing.updatedAt) || 0
        });
        return { ...note, ...normalizeNote(existing) };
      }

      const remoteRev = Number(existing.revision) || 1;
      const localRev = Number(note.revision) || 1;
      const knownLocalRev = sessionSync && remoteRev <= sessionSync.revision
        ? Math.max(localRev, sessionSync.revision)
        : localRev;
      const remoteUpdated = Number(existing.updatedAt) || 0;
      const localUpdated = Number(note.updatedAt) || 0;
      if (remoteRev > knownLocalRev && remoteUpdated > localUpdated && (existing.content !== payloadContent || existing.title !== payloadTitle)) {
        const conflictId = `${note.id}-conflict-${Date.now().toString(36)}`.slice(0, 128);
        const conflictRef = doc(db, 'users', uid, 'notes', conflictId);
        const conflictPayload = {
          id: conflictId,
          ownerUid: uid,
          title: `${payloadTitle.slice(0, 480)} (Conflict copy)`,
          content: payloadContent,
          tags: payloadTags,
          source: payloadSource,
          createdAt: Number(note.createdAt) || Date.now(),
          updatedAt: Date.now(),
          revision: 1,
          imageIds,
          conflictOf: note.id
        };
        await setDoc(conflictRef, conflictPayload);
        sessionSyncedState.set(syncKey, { revision: remoteRev, updatedAt: remoteUpdated });
        return {
          ...normalizeNote(existing),
          conflictCopy: normalizeNote(conflictPayload)
        };
      }
    }

    const nextRevision = existing ? (Number(existing.revision) || 1) + 1 : 1;
    const payload = {
      id: note.id,
      ownerUid: uid,
      title: payloadTitle,
      content: payloadContent,
      tags: payloadTags,
      source: payloadSource,
      createdAt: Number(note.createdAt) || Date.now(),
      updatedAt: Date.now(),
      revision: nextRevision,
      imageIds,
      ...(note.conflictOf ? { conflictOf: String(note.conflictOf).slice(0, 128) } : {}),
      ...(note.migrationId ? { migrationId: String(note.migrationId).slice(0, 128) } : {})
    };

    await setDoc(noteRef, payload);
    sessionSyncedState.set(syncKey, { revision: payload.revision, updatedAt: payload.updatedAt });
    return { ...note, ...payload };
  });
}

export function deleteNoteInFirestore(db, uid, noteId) {
  if (!uid || uid === 'guest' || !db || !noteId) return Promise.resolve();
  return enqueueNoteSync(`${uid}:${noteId}`, async () => {
    const noteRef = doc(db, 'users', uid, 'notes', noteId);
    try {
      await updateDoc(noteRef, {
        deleted: true,
        revision: increment(1),
        updatedAt: Date.now()
      });
    } catch (err) {
      console.warn('Could not soft-delete note in Firestore:', err);
    }
  });
}

export function subscribeNotesFromFirestore(db, uid, onSync) {
  if (!uid || uid === 'guest' || !db) return () => { };
  const notesCol = collection(db, 'users', uid, 'notes');
  return onSnapshot(notesCol, (snapshot) => {
    const remoteNotes = [];
    const deletedIds = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.deleted) {
        deletedIds.push(data.id || d.id);
      } else {
        remoteNotes.push(normalizeNote(data));
      }
    });
    if (remoteNotes.length > 0 || deletedIds.length > 0) {
      onSync(remoteNotes, deletedIds);
    }
  }, (err) => {
    console.warn('Firestore notes subscription error:', err);
  });
}
