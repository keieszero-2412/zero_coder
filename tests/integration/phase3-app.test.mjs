import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeNote,
  noteStorageKey,
  sanitizeNoteHtml,
  makeNote,
  loadLocalNotes,
  saveLocalNotes,
  isValidNoteUrl,
  createLinkHtml,
  linkifyPlainTextToHtml,
  linkifyHtmlFragment,
  applyBlockFormatToEditor,
  toggleInlineCodeInEditor,
  toggleInlineTagInEditor,
  computeEditorToolbarState
} from '../../src/utils/notesStorage.js';
import {
  evaluateAccessPolicy,
  resolveAccess,
  isTrustedSoleAdmin,
  SOLE_ADMIN_UID,
  SOLE_ADMIN_EMAIL
} from '../../src/utils/accessPolicy.js';
import { createImageStorage } from '../../src/utils/imageStorage.js';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';
import { validateImage } from '../../src/utils/notesImages.js';
import { htmlToBlocks, noteToMarkdown } from '../../src/utils/notesExport.js';

test('Notes storage: normalization, tag filtering and image extraction', () => {
  const hash = 'a'.repeat(64);
  const rawHtml = `<p>Hello world</p><figure data-align="center"><img data-image-id="${hash}" alt="Test Image"></figure><p>More text</p>`;
  const note = normalizeNote({
    id: 'note-1',
    title: '  My Note Title  ',
    content: rawHtml,
    tags: ['python', '#code', '  data  ', '', null, 'python'],
    source: { category: 'Learn', course: 'Database', lectureId: 'lec-1' }
  });

  assert.equal(note.id, 'note-1');
  assert.equal(note.title, '  My Note Title  ');
  assert.deepEqual(note.tags, ['python', '#code', 'data']);
  assert.equal(note.revision, 1);
  assert.equal(note.deleted, false);
  assert.equal(note.imageIds.length, 1);
  assert.equal(note.imageIds[0], 'a'.repeat(64));
});

test('Notes storage: account isolation key generation', () => {
  assert.equal(noteStorageKey('alice_123'), 'zerocoder_notes_alice_123');
  assert.equal(noteStorageKey('bob_456'), 'zerocoder_notes_bob_456');
  assert.equal(noteStorageKey(null), 'zerocoder_notes_guest');
  assert.equal(noteStorageKey(''), 'zerocoder_notes_guest');
  assert.notEqual(noteStorageKey('alice_123'), noteStorageKey('bob_456'));
});

test('HTML sanitizer removes malicious script and script tags from notes', () => {
  const unsafe = '<p>Normal text</p><script>alert("xss")</script><img src="x" onerror="evil()" /><figure><img data-image-id="12345678-1234-1234-1234-123456789abc" alt="Safe"></figure>';
  const clean = sanitizeNoteHtml(unsafe);
  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.includes('onerror='), false);
  assert.equal(clean.includes('data-image-id="12345678-1234-1234-1234-123456789abc"'), true);
});

test('Image storage client: unconfigured R2 raises clean descriptive error', async () => {
  const auth = { currentUser: { uid: 'alice', getIdToken: async () => 'valid-token' } };
  const client = createImageStorage({ auth, baseUrl: '', enabled: false });
  const pngBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });

  await assert.rejects(
    async () => client.save(pngBlob, { feature: 'feedback', parentId: 'fb-1', ownerUid: 'alice' }),
    /cloud image storage is not activated/i
  );
});

test('Image storage client: account switching during upload aborts and isolates', async () => {
  let activeUser = 'alice';
  const auth = {
    get currentUser() {
      return { uid: activeUser, getIdToken: async () => 'token-' + activeUser };
    }
  };

  const client = createImageStorage({
    auth,
    baseUrl: 'https://images.example.com',
    enabled: true,
    fetcher: async () => {
      // Switch active user mid-flight
      activeUser = 'bob';
      return Response.json({ error: 'Unexpected success' }, { status: 200 });
    }
  });

  const pngBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });
  await assert.rejects(
    async () => client.save(pngBlob, { feature: 'notes', parentId: 'n1', ownerUid: 'alice' }),
    /account changed/i
  );
});

test('Access Code evaluation: Green code preserved for Admin, Blue for users, Gray for limited, Red for unauthorized', () => {
  // Admin claim confers Green code only for pinned sole-admin UID
  const adminResult = evaluateAccessPolicy({ claims: { sub: 'y2umaD5NGygETtZEnuuUzus6j4i2', admin: true } });
  assert.equal(adminResult.role, 'Admin');
  assert.equal(adminResult.colorCode, 'Green');

  // Admin claim on any other UID does not confer Admin
  const rogueClaimResult = evaluateAccessPolicy({ claims: { sub: 'other-uid', admin: true }, userAccess: { code: 'Blue' } });
  assert.equal(rogueClaimResult.role, 'User');
  assert.equal(rogueClaimResult.colorCode, 'Blue');

  // User with Blue code
  const blueResult = evaluateAccessPolicy({ userAccess: { code: 'Blue' } });
  assert.equal(blueResult.role, 'User');
  assert.equal(blueResult.colorCode, 'Blue');

  // User with Gray code
  const grayResult = evaluateAccessPolicy({ userAccess: { code: 'Gray' } });
  assert.equal(grayResult.role, 'User');
  assert.equal(grayResult.colorCode, 'Gray');

  // Bypass on gives Gray code to unknown user
  const bypassResult = evaluateAccessPolicy({ bypass: true });
  assert.equal(bypassResult.role, 'User');
  assert.equal(bypassResult.colorCode, 'Gray');

  // Default without bypass gives Red code
  const redResult = evaluateAccessPolicy({ bypass: false });
  assert.equal(redResult.role, 'Unauthorized');
  assert.equal(redResult.colorCode, 'Red');

  // Profile role spoofing and non-owner admin claim do not confer Admin
  const resolveResult = resolveAccess({ admin: false }, { code: 'Red' }, null, false);
  assert.equal(resolveResult.role, 'Unauthorized');
  assert.equal(resolveResult.colorCode, 'Red');
  const nonOwnerClaimResult = resolveAccess({ sub: 'support', admin: true }, null, null, false);
  assert.equal(nonOwnerClaimResult.role, 'Unauthorized');
  assert.equal(nonOwnerClaimResult.colorCode, 'Red');
});

test('Feedback image schema: legacy Base64 vs new R2 image IDs compatibility', () => {
  // Legacy feedback record with Base64 imageUrls
  const legacyFeedback = {
    id: 'fb-legacy',
    userId: 'alice',
    description: 'Found a bug in lecture 2',
    imageUrls: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
    status: 'new'
  };
  assert.equal(Array.isArray(legacyFeedback.imageUrls), true);
  assert.equal(legacyFeedback.imageUrls.length, 1);
  assert.match(legacyFeedback.imageUrls[0], /^data:image\/jpeg;base64,/);

  // New feedback record with R2 imageIds (strictly empty imageUrls)
  const r2Feedback = {
    id: 'fb-new',
    userId: 'alice',
    description: 'UI glitch on dark theme',
    imageIds: ['b'.repeat(64)],
    imageUrls: [],
    status: 'new'
  };
  assert.deepEqual(r2Feedback.imageUrls, []);
  assert.equal(r2Feedback.imageIds.length, 1);
  assert.match(r2Feedback.imageIds[0], /^[a-f0-9]{64}$/);
});

test('Notes storage: conflictOf and migrationId normalization preserved', () => {
  const note = normalizeNote({
    id: 'note-1-conflict-abc',
    title: 'My Note (Conflict copy)',
    content: '<p>Divergent edit</p>',
    conflictOf: 'note-1',
    migrationId: 'mig-123'
  });
  assert.equal(note.conflictOf, 'note-1');
  assert.equal(note.migrationId, 'mig-123');
});

test('Email/Password auth policy: Sole Admin with unverified email stays Green; email grant requires email_verified=true', () => {
  assert.equal(isTrustedSoleAdmin({ uid: SOLE_ADMIN_UID, email: SOLE_ADMIN_EMAIL, emailVerified: false }, { admin: true }), true);
  assert.deepEqual(
    resolveAccess({ sub: SOLE_ADMIN_UID, email: SOLE_ADMIN_EMAIL, email_verified: false, admin: true }, null, null, false),
    { role: 'Admin', colorCode: 'Green' }
  );

  // Non-admin email grant must stay Unauthorized when email_verified is false
  assert.deepEqual(
    resolveAccess({ sub: 'u1', email_verified: false, admin: false }, null, { code: 'Blue' }, false),
    { role: 'Unauthorized', colorCode: 'Red' }
  );
  // Once Email/Password verification completes, email grant activates
  assert.deepEqual(
    resolveAccess({ sub: 'u1', email_verified: true, admin: false }, null, { code: 'Blue' }, false),
    { role: 'User', colorCode: 'Blue' }
  );
  // Unknown user with bypass=false is Unauthorized
  assert.deepEqual(
    resolveAccess({ sub: 'unknown', email_verified: true, admin: false }, null, null, false),
    { role: 'Unauthorized', colorCode: 'Red' }
  );
});

test('Notes local CRUD, per-UID isolation, magic-byte image validation, and Markdown export structure', async () => {
  const prevStorage = globalThis.localStorage;
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };

  try {
    const starter = loadLocalNotes('alice');
    assert.equal(starter.length, 1);
    assert.equal(starter[0].title, 'New note');

    const n1 = makeNote();
    const n2 = normalizeNote({
      id: 'n2',
      title: 'SQL Window Functions',
      content: '<p>Practice RANK and DENSE_RANK</p>',
      tags: ['sql', 'midterm'],
      source: { category: 'Learn', course: 'database', lectureId: 'L5' },
      createdAt: 1700000000000,
      updatedAt: 1700000005000
    });
    saveLocalNotes('alice', [n1, n2]);
    const aliceLoaded = loadLocalNotes('alice');
    const bobLoaded = loadLocalNotes('bob');
    assert.equal(aliceLoaded.length, 2);
    assert.equal(bobLoaded.length, 1);
    assert.equal(bobLoaded.some((n) => n.id === 'n2'), false);
  } finally {
    if (prevStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = prevStorage;
  }

  // validateImage checks PNG/JPEG/WebP/GIF magic bytes and rejects spoofs
  const pngFile = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13])], { type: 'image/png' });
  const jpgFile = new Blob([new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1])], { type: 'image/jpeg' });
  const webpFile = new Blob([new Uint8Array([82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80])], { type: 'image/webp' });
  const gifFile = new Blob([new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 0, 0])], { type: 'image/gif' });
  assert.equal(await validateImage(pngFile), 'png');
  assert.equal(await validateImage(jpgFile), 'jpg');
  assert.equal(await validateImage(webpFile), 'webp');
  assert.equal(await validateImage(gifFile), 'gif');

  const spoofedPng = new Blob([new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 0, 0])], { type: 'image/png' });
  await assert.rejects(() => validateImage(spoofedPng), /do not match/i);

  // Markdown export formats metadata + block tree cleanly
  const prevDoc = globalThis.document;
  const prevNode = globalThis.Node;
  const hash = 'b'.repeat(64);
  const textNode = (text) => ({ nodeType: 3, nodeValue: text, childNodes: [] });
  const elemNode = (tagName, opts = {}) => ({
    nodeType: 1,
    tagName,
    childNodes: opts.children || [],
    dataset: opts.dataset || {},
    alt: opts.alt || '',
    textContent: opts.textContent || '',
    parentElement: opts.parentElement || null,
    getAttribute: (k) => opts.attrs?.[k] || null,
    closest: (sel) => (sel === 'figure' ? opts.figure || null : null),
    querySelector: (sel) => (sel === 'img' ? opts.imgChild || null : null)
  });

  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  globalThis.document = {
    createElement: () => {
      const fig = elemNode('FIGURE', { dataset: { width: '80', align: 'center' } });
      const img = elemNode('IMG', { dataset: { imageId: hash }, alt: 'ER Diagram', figure: fig });
      fig.children = [img];
      fig.childNodes = [img];
      const olParent = elemNode('OL');
      return {
        childNodes: [
          elemNode('H2', { children: [textNode('Normalization')] }),
          elemNode('P', { children: [textNode('Keep 3NF for core tables.')] }),
          elemNode('BLOCKQUOTE', { children: [textNode('Preserve legacy bytes.')] }),
          elemNode('LI', { children: [textNode('Bullet item')] }),
          elemNode('LI', { parentElement: olParent, children: [textNode('Ordered step')] }),
          elemNode('PRE', { textContent: 'SELECT * FROM notes;' }),
          fig
        ],
        set innerHTML(_v) {}
      };
    }
  };

  try {
    const md = noteToMarkdown({
      title: 'Database Midterm',
      tags: ['sql', 'notes'],
      source: { category: 'Learn', label: 'Lecture 5', path: '/learn?lectureId=L5' },
      createdAt: 1700000000000,
      content: '<p>ignored by mock dom</p>'
    });
    assert.match(md, /^# Database Midterm/m);
    assert.match(md, /^Tags: #sql #notes/m);
    assert.match(md, /^Source: Lecture 5 \(\/learn\?lectureId=L5\)/m);
    assert.match(md, /^Created: 2023-11-14T/m);
    assert.match(md, /^## Normalization/m);
    assert.match(md, /^Keep 3NF for core tables\./m);
    assert.match(md, /^> Preserve legacy bytes\./m);
    assert.match(md, /^- Bullet item/m);
    assert.match(md, /^1\. Ordered step/m);
    assert.match(md, /```\nSELECT \* FROM notes;\n```/m);
    assert.match(md, new RegExp(`!\\[ER Diagram\\]\\(assets/${hash}\\)`));
  } finally {
    if (prevDoc === undefined) delete globalThis.document;
    else globalThis.document = prevDoc;
    if (prevNode === undefined) delete globalThis.Node;
    else globalThis.Node = prevNode;
  }
});

test('Notes URL recognition & plain-text linkification preserve content and ignore unsafe schemes', () => {
  assert.equal(
    isValidNoteUrl('http://localhost:5173/?course=programming&term=final&tool=interactive'),
    'http://localhost:5173/?course=programming&term=final&tool=interactive'
  );
  assert.equal(isValidNoteUrl('https://zerocoder.dev/docs?q=notes#h2'), 'https://zerocoder.dev/docs?q=notes#h2');
  assert.equal(isValidNoteUrl('mailto:zero@zerocoder.dev'), 'mailto:zero@zerocoder.dev');
  assert.equal(isValidNoteUrl('javascript:alert(1)'), '');
  assert.equal(isValidNoteUrl('not a valid url'), '');

  const linked = linkifyPlainTextToHtml('See https://zerocoder.dev/guide_(v2), or email mailto:help@zerocoder.dev.');
  assert.equal(linked.urlCount, 2);
  assert.equal(
    linked.html,
    'See <a href="https://zerocoder.dev/guide_(v2)" target="_blank" rel="noopener noreferrer">https://zerocoder.dev/guide_(v2)</a>, or email <a href="mailto:help@zerocoder.dev" target="_blank" rel="noopener noreferrer">mailto:help@zerocoder.dev</a>.'
  );

  const linkTag = createLinkHtml('https://zerocoder.dev', 'ZeroCoder');
  assert.equal(linkTag, '<a href="https://zerocoder.dev" target="_blank" rel="noopener noreferrer">ZeroCoder</a>');
});

test('Notes DOM editor formatting: H1/H2/H3 toggle, inline code/bold/italic state, linkification, and image resize attributes', () => {
  const prevDoc = globalThis.document;
  const prevWin = globalThis.window;
  const prevNode = globalThis.Node;
  const prevNodeFilter = globalThis.NodeFilter;
  const prevDOMParser = globalThis.DOMParser;

  const createMockDom = () => {
    class MockText {
      constructor(value = '') {
        this.nodeType = 3;
        this.nodeValue = String(value);
        this.parentNode = null;
      }
      get parentElement() {
        return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
      }
      get textContent() {
        return this.nodeValue;
      }
      set textContent(v) {
        this.nodeValue = String(v);
      }
      get nextSibling() {
        if (!this.parentNode) return null;
        const idx = this.parentNode.childNodes.indexOf(this);
        return idx >= 0 ? this.parentNode.childNodes[idx + 1] || null : null;
      }
      remove() {
        if (!this.parentNode) return;
        this.parentNode.childNodes = this.parentNode.childNodes.filter((n) => n !== this);
        this.parentNode = null;
      }
    }

    class MockElement {
      constructor(tagName) {
        this.nodeType = 1;
        this.tagName = String(tagName).toUpperCase();
        this.childNodes = [];
        this.parentNode = null;
        this.attrs = {};
        this.style = {};
      }
      get parentElement() {
        return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
      }
      get children() {
        return this.childNodes.filter((c) => c.nodeType === 1);
      }
      get firstChild() {
        return this.childNodes[0] || null;
      }
      get firstElementChild() {
        return this.children[0] || null;
      }
      get nextSibling() {
        if (!this.parentNode) return null;
        const idx = this.parentNode.childNodes.indexOf(this);
        return idx >= 0 ? this.parentNode.childNodes[idx + 1] || null : null;
      }
      get dataset() {
        const self = this;
        return new Proxy({}, {
          get(_t, prop) {
            const kebab = String(prop).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            return self.attrs[`data-${kebab}`];
          },
          set(_t, prop, val) {
            const kebab = String(prop).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            self.attrs[`data-${kebab}`] = String(val);
            return true;
          }
        });
      }
      get alt() {
        return this.attrs.alt || '';
      }
      set alt(v) {
        this.attrs.alt = String(v);
      }
      get textContent() {
        return this.childNodes.map((c) => c.textContent).join('');
      }
      set textContent(v) {
        this.childNodes = v ? [new MockText(v)] : [];
        this.childNodes.forEach((c) => { c.parentNode = this; });
      }
      get innerHTML() {
        return this.childNodes.map((c) => {
          if (c.nodeType === 3) return c.nodeValue;
          const tag = c.tagName.toLowerCase();
          const attrs = Object.entries(c.attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
          const styleEntries = Object.entries(c.style || {});
          const styleAttr = styleEntries.length
            ? ` style="${styleEntries.map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${v};`).join(' ')}"`
            : '';
          if (tag === 'br' || tag === 'img' || tag === 'hr') return `<${tag}${attrs}${styleAttr}>`;
          return `<${tag}${attrs}${styleAttr}>${c.innerHTML}</${tag}>`;
        }).join('');
      }
      set innerHTML(v) {
        if (v === '<br>') {
          const br = new MockElement('br');
          br.parentNode = this;
          this.childNodes = [br];
        } else {
          this.childNodes = v ? [new MockText(v)] : [];
          this.childNodes.forEach((c) => { c.parentNode = this; });
        }
      }
      setAttribute(k, v) {
        this.attrs[k] = String(v);
      }
      getAttribute(k) {
        return k in this.attrs ? this.attrs[k] : null;
      }
      appendChild(node) {
        if (node.parentNode) node.remove();
        node.parentNode = this;
        this.childNodes.push(node);
        return node;
      }
      insertBefore(node, refNode) {
        if (!refNode) return this.appendChild(node);
        if (node.parentNode) node.remove();
        const idx = this.childNodes.indexOf(refNode);
        node.parentNode = this;
        if (idx === -1) this.childNodes.push(node);
        else this.childNodes.splice(idx, 0, node);
        return node;
      }
      replaceChild(newNode, oldNode) {
        const idx = this.childNodes.indexOf(oldNode);
        if (idx === -1) return oldNode;
        oldNode.parentNode = null;
        if (newNode.tagName === '#FRAGMENT') {
          const children = [...newNode.childNodes];
          children.forEach((child) => { child.parentNode = this; });
          newNode.childNodes = [];
          this.childNodes.splice(idx, 1, ...children);
          return oldNode;
        }
        if (newNode.parentNode) newNode.remove();
        newNode.parentNode = this;
        this.childNodes[idx] = newNode;
        return oldNode;
      }
      remove() {
        if (!this.parentNode) return;
        this.parentNode.childNodes = this.parentNode.childNodes.filter((n) => n !== this);
        this.parentNode = null;
      }
      contains(target) {
        let cur = target;
        while (cur) {
          if (cur === this) return true;
          cur = cur.parentNode;
        }
        return false;
      }
      closest(sel) {
        const tags = new Set(sel.split(',').map((s) => s.trim().toUpperCase()));
        let cur = this;
        while (cur) {
          if (cur.nodeType === 1 && tags.has(cur.tagName)) return cur;
          cur = cur.parentNode;
        }
        return null;
      }
      querySelector(sel) {
        const targetTag = sel.trim().toUpperCase();
        for (const c of this.children) {
          if (c.tagName === targetTag) return c;
          const nested = c.querySelector(sel);
          if (nested) return nested;
        }
        return null;
      }
      querySelectorAll(sel) {
        const targetTag = sel.trim().toUpperCase();
        const out = [];
        for (const c of this.children) {
          if (c.tagName === targetTag) out.push(c);
          out.push(...c.querySelectorAll(sel));
        }
        return out;
      }
    }

    class MockRange {
      constructor() {
        this.startContainer = null;
        this.startOffset = 0;
        this.endContainer = null;
        this.endOffset = 0;
        this.collapsed = true;
      }
      get commonAncestorContainer() {
        return this.startContainer;
      }
      setStart(node, offset) {
        this.startContainer = node;
        this.startOffset = offset;
        this.collapsed = this.startContainer === this.endContainer && this.startOffset === this.endOffset;
      }
      setEnd(node, offset) {
        this.endContainer = node;
        this.endOffset = offset;
        this.collapsed = this.startContainer === this.endContainer && this.startOffset === this.endOffset;
      }
      collapse(toStart) {
        if (toStart) {
          this.endContainer = this.startContainer;
          this.endOffset = this.startOffset;
        } else {
          this.startContainer = this.endContainer;
          this.startOffset = this.endOffset;
        }
        this.collapsed = true;
      }
      selectNodeContents(node) {
        this.startContainer = node;
        this.startOffset = 0;
        this.endContainer = node;
        this.endOffset = node.nodeType === 3 ? node.nodeValue.length : node.childNodes.length;
        this.collapsed = this.endOffset === 0;
      }
      intersectsNode(node) {
        return this.startContainer === node || (node.contains && node.contains(this.startContainer)) || (this.startContainer?.contains && this.startContainer.contains(node));
      }
      extractContents() {
        const frag = new MockElement('#fragment');
        if (this.startContainer?.nodeType === 3) {
          const text = this.startContainer.nodeValue.slice(this.startOffset, this.endOffset);
          this.startContainer.nodeValue = this.startContainer.nodeValue.slice(0, this.startOffset) + this.startContainer.nodeValue.slice(this.endOffset);
          frag.appendChild(new MockText(text));
        } else if (this.startContainer) {
          [...this.startContainer.childNodes].forEach((c) => frag.appendChild(c));
        }
        this.collapsed = true;
        return frag;
      }
      insertNode(node) {
        if (node.tagName === '#FRAGMENT') {
          [...node.childNodes].forEach((child) => this.insertNode(child));
          return;
        }
        if (this.startContainer?.nodeType === 3 && this.startContainer.parentNode) {
          this.startContainer.parentNode.insertBefore(node, this.startContainer.nextSibling);
        } else if (this.startContainer?.appendChild) {
          this.startContainer.appendChild(node);
        }
      }
    }

    const selection = {
      ranges: [],
      get rangeCount() { return this.ranges.length; },
      getRangeAt(i) { return this.ranges[i]; },
      removeAllRanges() { this.ranges = []; },
      addRange(r) { this.ranges = [r]; }
    };

    const doc = {
      createElement: (tag) => new MockElement(tag),
      createTextNode: (text) => new MockText(text),
      createDocumentFragment: () => new MockElement('#fragment'),
      createRange: () => new MockRange(),
      createTreeWalker: (root) => {
        const list = [];
        const walk = (n) => {
          if (n.nodeType === 3) list.push(n);
          else n.childNodes?.forEach(walk);
        };
        walk(root);
        let idx = 0;
        return { nextNode: () => list[idx++] || null };
      }
    };

    return { MockElement, MockText, MockRange, selection, doc };
  };

  const dom = createMockDom();
  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  globalThis.NodeFilter = { SHOW_TEXT: 4 };
  globalThis.document = dom.doc;
  globalThis.window = { getSelection: () => dom.selection };
  globalThis.DOMParser = class {
    parseFromString(str) {
      const body = new dom.MockElement('body');
      const parserHelper = (markup, parent) => {
        const tokenRegex = /<\/?([a-z0-9]+)([^>]*)>|([^<]+)/gi;
        const stack = [parent];
        let m;
        while ((m = tokenRegex.exec(markup)) !== null) {
          if (m[3] !== undefined) {
            stack[stack.length - 1].appendChild(new dom.MockText(m[3]));
          } else if (m[0].startsWith('</')) {
            if (stack.length > 1) stack.pop();
          } else {
            const el = new dom.MockElement(m[1]);
            const attrRegex = /([a-z0-9-]+)=["']([^"']*)["']/gi;
            let am;
            while ((am = attrRegex.exec(m[2] || '')) !== null) {
              el.setAttribute(am[1], am[2]);
            }
            stack[stack.length - 1].appendChild(el);
            if (!['br', 'img', 'hr'].includes(m[1].toLowerCase()) && !m[2].trim().endsWith('/')) {
              stack.push(el);
            }
          }
        }
      };
      parserHelper(String(str || ''), body);
      return {
        body,
        createDocumentFragment: () => dom.doc.createDocumentFragment(),
        createElement: (tag) => dom.doc.createElement(tag),
        createTextNode: (text) => dom.doc.createTextNode(text)
      };
    }
  };

  try {
    // 1. Real H2 / H1 / H3 block formatting & Paragraph toggle
    const editor = dom.doc.createElement('div');
    const p = dom.doc.createElement('p');
    const boldWord = dom.doc.createElement('strong');
    const innerText = dom.doc.createTextNode('Design Systems');
    boldWord.appendChild(innerText);
    p.appendChild(boldWord);
    editor.appendChild(p);

    const range = dom.doc.createRange();
    range.setStart(innerText, 0);
    range.setEnd(innerText, innerText.nodeValue.length);
    dom.selection.addRange(range);

    assert.equal(computeEditorToolbarState(editor).bold, true);
    assert.equal(computeEditorToolbarState(editor).block, 'p');

    const appliedH2 = applyBlockFormatToEditor(editor, 'h2', range, { toggleToParagraph: true });
    assert.equal(appliedH2, 'h2');
    assert.equal(editor.children[0].tagName, 'H2');
    assert.equal(editor.children[0].children[0].tagName, 'STRONG');
    assert.equal(computeEditorToolbarState(editor).block, 'h2');
    assert.equal(computeEditorToolbarState(editor).bold, true);

    // Clicking active H2 again toggles back to <p>
    const toggledP = applyBlockFormatToEditor(editor, 'h2', dom.selection.getRangeAt(0), { toggleToParagraph: true });
    assert.equal(toggledP, 'p');
    assert.equal(editor.children[0].tagName, 'P');
    assert.equal(computeEditorToolbarState(editor).block, 'p');

    // Switch to H1 and H3 cleanly
    applyBlockFormatToEditor(editor, 'h1');
    assert.equal(computeEditorToolbarState(editor).block, 'h1');
    applyBlockFormatToEditor(editor, 'h3');
    assert.equal(computeEditorToolbarState(editor).block, 'h3');

    // 2. Inline code & Pre code block differentiation + Italic/Underline/Strike toggle
    const p2 = dom.doc.createElement('p');
    const codeText = dom.doc.createTextNode('const x = 1');
    p2.appendChild(codeText);
    editor.appendChild(p2);
    const codeRange = dom.doc.createRange();
    codeRange.setStart(codeText, 0);
    codeRange.setEnd(codeText, codeText.nodeValue.length);
    dom.selection.addRange(codeRange);

    assert.equal(toggleInlineCodeInEditor(editor, codeRange), true);
    assert.equal(computeEditorToolbarState(editor).inlineCode, true);
    assert.equal(computeEditorToolbarState(editor).codeBlock, false);

    assert.equal(toggleInlineTagInEditor(editor, 'italic', ['EM', 'I']), true);
    assert.equal(computeEditorToolbarState(editor).italic, true);

    applyBlockFormatToEditor(editor, 'pre');
    assert.equal(computeEditorToolbarState(editor).codeBlock, true);
    assert.equal(computeEditorToolbarState(editor).inlineCode, false);

    // 3. linkifyHtmlFragment skips existing <a> and <code> while converting bare URLs
    const { html: linkedHtml, urlCount } = linkifyHtmlFragment(
      '<p><b>Docs:</b> https://zerocoder.dev <code>https://ignore.dev</code> <a href="https://existing.dev">Existing</a></p>'
    );
    assert.equal(urlCount, 1);
    assert.equal(linkedHtml.includes('href="https://zerocoder.dev"'), true);
    assert.equal(linkedHtml.includes('<code>https://ignore.dev</code>'), true);
    assert.equal(linkedHtml.includes('href="https://existing.dev"'), true);

    // 4. Sanitize note HTML preserves resized image pixel dimensions, % width, <strike>-><s>, and strips data-selected
    const imgHash = 'c'.repeat(64);
    const resizedHtml = `<figure data-selected="true" data-align="right" data-width="65" data-width-px="360" data-height-px="240"><img data-image-id="${imgHash}" width="360" height="240" alt="Arch"><figcaption>Diagram</figcaption></figure><strike>old</strike>`;
    const cleanHtml = sanitizeNoteHtml(resizedHtml);
    assert.equal(cleanHtml.includes('data-selected='), false);
    assert.equal(cleanHtml.includes('data-width="65"'), true);
    assert.equal(cleanHtml.includes('data-width-px="360"'), true);
    assert.equal(cleanHtml.includes('data-height-px="240"'), true);
    assert.equal(cleanHtml.includes('data-align="right"'), true);
    assert.equal(cleanHtml.includes('<s>old</s>'), true);

    // 5. Export pipeline preserves custom image pixel dimensions & Markdown heading levels
    const origCreateElement = dom.doc.createElement.bind(dom.doc);
    dom.doc.createElement = (tag) => {
      if (tag === 'div') {
        const container = origCreateElement('div');
        Object.defineProperty(container, 'innerHTML', {
          set(val) {
            const pDoc = new globalThis.DOMParser().parseFromString(val, 'text/html');
            container.childNodes = pDoc.body.childNodes;
            container.childNodes.forEach((n) => { n.parentNode = container; });
          },
          get() { return ''; }
        });
        return container;
      }
      return origCreateElement(tag);
    };
    const blocks = htmlToBlocks(cleanHtml);
    const imgBlock = blocks.find((b) => b.type === 'image');
    assert.equal(imgBlock?.width, 65);
    assert.equal(imgBlock?.widthPx, 360);
    assert.equal(imgBlock?.heightPx, 240);
    assert.equal(imgBlock?.align, 'right');

    const mdHeadings = noteToMarkdown({
      title: 'Export Test',
      content: '<h1>Alpha</h1><h2>Beta</h2><h3>Gamma</h3>'
    });
    assert.match(mdHeadings, /^# Alpha/m);
    assert.match(mdHeadings, /^## Beta/m);
    assert.match(mdHeadings, /^### Gamma/m);
  } finally {
    if (prevDoc === undefined) delete globalThis.document;
    else globalThis.document = prevDoc;
    if (prevWin === undefined) delete globalThis.window;
    else globalThis.window = prevWin;
    if (prevNode === undefined) delete globalThis.Node;
    else globalThis.Node = prevNode;
    if (prevNodeFilter === undefined) delete globalThis.NodeFilter;
    else globalThis.NodeFilter = prevNodeFilter;
    if (prevDOMParser === undefined) delete globalThis.DOMParser;
    else globalThis.DOMParser = prevDOMParser;
  }
});

test('Image storage client: default fetcher binds globalThis to avoid browser Illegal invocation', async () => {
  const prevFetch = globalThis.fetch;
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 1]);
  const pngBlob = new Blob([pngBytes], { type: 'image/png' });
  const prepared = await prepareOriginal(pngBlob, { feature: 'notes', parentId: 'note-1', ownerUid: 'alice' });

  globalThis.fetch = function strictFetch() {
    if (this !== globalThis) {
      throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
    }
    return Promise.resolve(
      Response.json({
        id: prepared.id,
        ownerUid: 'alice',
        feature: 'notes',
        objectKey: prepared.objectKey,
        contentType: 'image/png',
        size: prepared.size,
        sha256: prepared.sha256,
        state: 'ready'
      })
    );
  };

  try {
    const auth = { currentUser: { uid: 'alice', getIdToken: async () => 'token-alice' } };
    const client = createImageStorage({ auth, baseUrl: 'https://images.example.com', enabled: true });
    const saved = await client.save(pngBlob, { feature: 'notes', parentId: 'note-1', ownerUid: 'alice' });
    assert.equal(saved.id, prepared.id);
    assert.equal(saved.state, 'ready');
  } finally {
    globalThis.fetch = prevFetch;
  }
});
