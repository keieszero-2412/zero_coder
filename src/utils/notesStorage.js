import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, increment } from 'firebase/firestore';

export const EMPTY_CONTENT = '<p><br></p>';
export const STORAGE_PREFIX = 'zerocoder_notes_';
const ALLOWED_TAGS = new Set(['P', 'BR', 'H1', 'H2', 'H3', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'HR', 'FIGURE', 'FIGCAPTION', 'IMG']);

export function sanitizeNoteHtml(value) {
  if (typeof document === 'undefined') {
    if (!value) return EMPTY_CONTENT;
    return String(value)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }
  const parser = new DOMParser();
  const source = parser.parseFromString(String(value || EMPTY_CONTENT), 'text/html');
  const clean = document.createElement('div');

  const walk = (node, parent) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.nodeValue));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(tag)) {
      [...node.childNodes].forEach((child) => walk(child, parent));
      return;
    }
    const next = document.createElement(tag.toLowerCase());
    if (tag === 'IMG') {
      const id = node.getAttribute('data-image-id');
      if (!/^([a-f0-9-]{36}|[a-f0-9]{64})$/i.test(id || '')) return;
      next.setAttribute('data-image-id', id);
      next.setAttribute('alt', (node.getAttribute('alt') || 'Note image').slice(0, 500));
    }
    if (tag === 'FIGURE') {
      next.setAttribute('contenteditable', 'false');
      const align = node.getAttribute('data-align');
      next.setAttribute('data-align', ['left', 'center', 'right'].includes(align) ? align : 'center');
      const width = Math.max(10, Math.min(100, Number(node.getAttribute('data-width')) || 100));
      next.setAttribute('data-width', String(width));
      next.style.width = `${width}%`;
    }
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^(https?:|mailto:)/i.test(href)) {
        next.setAttribute('href', href);
        next.setAttribute('target', '_blank');
        next.setAttribute('rel', 'noopener noreferrer');
      }
    }
    [...node.childNodes].forEach((child) => walk(child, next));
    parent.appendChild(next);
  };

  [...source.body.childNodes].forEach((node) => walk(node, clean));
  return clean.innerHTML || EMPTY_CONTENT;
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
    deleted: Boolean(note.deleted)
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

export async function syncNoteToFirestore(db, uid, note) {
  if (!uid || uid === 'guest' || !db) return note;
  const imageIds = extractImageIds(note.content);
  const noteRef = doc(db, 'users', uid, 'notes', note.id);
  const snap = await getDoc(noteRef);
  const existing = snap.exists() ? snap.data() : null;

  const nextRevision = existing ? (Number(existing.revision) || 1) + 1 : 1;
  const payload = {
    id: note.id,
    ownerUid: uid,
    title: (note.title || 'New note').slice(0, 500),
    content: (note.content || EMPTY_CONTENT).slice(0, 800000),
    tags: Array.isArray(note.tags) ? note.tags.slice(0, 20) : [],
    source: note.source || null,
    createdAt: Number(note.createdAt) || Date.now(),
    updatedAt: Date.now(),
    revision: nextRevision,
    imageIds
  };

  await setDoc(noteRef, payload);
  return { ...note, ...payload };
}

export async function deleteNoteInFirestore(db, uid, noteId) {
  if (!uid || uid === 'guest' || !db) return;
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
}

export function subscribeNotesFromFirestore(db, uid, onSync) {
  if (!uid || uid === 'guest' || !db) return () => {};
  const notesCol = collection(db, 'users', uid, 'notes');
  return onSnapshot(notesCol, (snapshot) => {
    const remoteNotes = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (!data.deleted) {
        remoteNotes.push(normalizeNote(data));
      }
    });
    if (remoteNotes.length > 0) {
      onSync(remoteNotes);
    }
  }, (err) => {
    console.warn('Firestore notes subscription error:', err);
  });
}
