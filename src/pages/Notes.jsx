import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Check,
  ChevronDown,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Heading2,
  Italic,
  ImagePlus,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Quote,
  Redo2,
  Strikethrough,
  Trash2,
  Underline,
  Undo2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTerm } from '../context/TermContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { exportDocx, exportMarkdown, exportPdf } from '../utils/notesExport';
import { getNoteImage, storeNoteImage } from '../utils/notesImages';
import '../index.css';

const EMPTY_CONTENT = '<p><br></p>';
const STORAGE_PREFIX = 'zerocoder_notes_';
const POSITION_PREFIX = 'zerocoder_notes_position_';
const DEFAULT_POSITION = { right: 24, bottom: 24 };
const ALLOWED_TAGS = new Set(['P', 'BR', 'H1', 'H2', 'H3', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'HR', 'FIGURE', 'FIGCAPTION', 'IMG']);

export function sanitizeNoteHtml(value) {
  if (typeof document === 'undefined') return EMPTY_CONTENT;
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
      if (!/^[a-f0-9-]{36}$/i.test(id || '')) return;
      next.setAttribute('data-image-id', id);
      next.setAttribute('alt', (node.getAttribute('alt') || 'Note image').slice(0, 500));
      // Runtime blob URLs are deliberately excluded from saved HTML.
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

function noteStorageKey(uid) {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

function normalizeNote(note) {
  const now = Date.now();
  return {
    id: note.id || `note-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: typeof note.title === 'string' ? note.title : 'New note',
    content: sanitizeNoteHtml(note.content || EMPTY_CONTENT),
    createdAt: Number(note.createdAt) || now,
    updatedAt: Number(note.updatedAt) || Number(note.createdAt) || now,
    tags: Array.isArray(note.tags) ? [...new Set(note.tags.filter(Boolean).map((tag) => String(tag).trim().slice(0, 32)))].slice(0, 20) : [],
    source: note.source && typeof note.source === 'object' ? { ...note.source } : null
  };
}

function makeNote() {
  const now = Date.now();
  return normalizeNote({ id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`, title: 'New note', content: EMPTY_CONTENT, createdAt: now, updatedAt: now, tags: [], source: null });
}

function loadNotes(uid) {
  try {
    const raw = localStorage.getItem(noteStorageKey(uid));
    const notes = raw ? JSON.parse(raw) : [];
    return Array.isArray(notes) && notes.length ? notes.map(normalizeNote) : [makeNote()];
  } catch {
    return [makeNote()];
  }
}

function loadPosition(uid) {
  try {
    const value = JSON.parse(localStorage.getItem(`${POSITION_PREFIX}${uid || 'guest'}`) || 'null');
    return value && Number.isFinite(value.right) && Number.isFinite(value.bottom) ? value : DEFAULT_POSITION;
  } catch {
    return DEFAULT_POSITION;
  }
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(timestamp);
}

function captureSource(location, course, term, tool) {
  if (!location?.pathname || location.pathname === '/' || location.pathname === '/auth') return null;
  const params = new URLSearchParams(location.search);
  const category = location.pathname.includes('/learn') || tool === 'interactive' ? 'Learn' : tool === 'tests' || location.pathname.includes('/workspace') ? 'Test' : tool === 'cheatsheet' ? 'Cheatsheet' : 'Workspace';
  const lectureId = params.get('lectureId') || params.get('lecture') || null;
  const questionId = params.get('questionId') || params.get('problemId') || params.get('id') || null;
  const sourceId = questionId || lectureId || `${location.pathname}${location.search}`;
  return {
    path: `${location.pathname}${location.search}`,
    sourceId,
    label: params.get('filter') || lectureId || questionId || category,
    category,
    course: course || null,
    term: term || null,
    tool: tool || null,
    lectureId,
    questionId,
    createdAt: Date.now()
  };
}

function sourceLabel(source) {
  if (!source) return '';
  return [source.category, source.label, source.course, source.term ? `${source.term}-term` : null].filter(Boolean).join(' · ');
}

function ToolbarButton({ label, icon: Icon, onMouseDown, active = false }) {
  return (
    <button type="button" className={`zc-notes-tool ${active ? 'active' : ''}`} aria-label={label} title={label} onMouseDown={onMouseDown}>
      <Icon size={16} strokeWidth={1.8} />
    </button>
  );
}

export function Notes() {
  const { currentUser } = useAuth();
  const { showConfirm, showToast } = useNotification();
  const { activeCourse, activeTerm, activeTool } = useTerm();
  const location = useLocation();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const imageRangeRef = useRef(null);
  const imageBusyRef = useRef(false);
  const imageUrlsRef = useRef(new Map());
  const currentNotesRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const panelDragRef = useRef(null);
  const saveTimerRef = useRef(null);
  const dragRef = useRef(null);
  const suppressTriggerClickRef = useRef(false);
  const [notes, setNotes] = useState(() => loadNotes(currentUser?.uid));
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('updated');
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [sourceEditing, setSourceEditing] = useState(false);
  const [position, setPosition] = useState(() => loadPosition(currentUser?.uid));
  const [isDragging, setIsDragging] = useState(false);
  const [panelDragging, setPanelDragging] = useState(false);
  const [panelPositions, setPanelPositions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${POSITION_PREFIX}popup_${currentUser?.uid || 'guest'}`)) || {}; }
    catch { return {}; }
  });
  const panelMode = fullscreen ? 'expanded' : 'compact';
  const panelPosition = panelPositions[panelMode];

  const movePanel = useCallback((left, top) => {
    const panel = panelRef.current;
    if (!panel) return;
    const viewport = window.visualViewport;
    const x = viewport?.offsetLeft || 0;
    const y = viewport?.offsetTop || 0;
    const width = viewport?.width || window.innerWidth;
    const height = viewport?.height || window.innerHeight;
    const next = {
      left: Math.max(x + 8, Math.min(left, x + width - panel.offsetWidth - 8)),
      top: Math.max(y + 8, Math.min(top, y + height - panel.offsetHeight - 8))
    };
    setPanelPositions((previous) => {
      const old = previous[panelMode];
      if (old?.left === next.left && old?.top === next.top) return previous;
      return { ...previous, [panelMode]: next };
    });
  }, [panelMode]);

  useEffect(() => {
    try { localStorage.setItem(`${POSITION_PREFIX}popup_${currentUser?.uid || 'guest'}`, JSON.stringify(panelPositions)); }
    catch { /* Position persistence is best effort; note persistence is independent. */ }
  }, [panelPositions, currentUser?.uid]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    const constrain = () => {
      const panel = panelRef.current;
      const viewport = window.visualViewport;
      panel.style.maxWidth = `${(viewport?.width || window.innerWidth) - 16}px`;
      panel.style.maxHeight = `${(viewport?.height || window.innerHeight) - 16}px`;
      movePanel(panel.offsetLeft, panel.offsetTop);
    };
    constrain();
    const observer = new ResizeObserver(constrain);
    observer.observe(panelRef.current);
    window.addEventListener('resize', constrain);
    window.visualViewport?.addEventListener('resize', constrain);
    window.visualViewport?.addEventListener('scroll', constrain);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', constrain);
      window.visualViewport?.removeEventListener('resize', constrain);
      window.visualViewport?.removeEventListener('scroll', constrain);
    };
  }, [isOpen, fullscreen, movePanel]);

  const startPanelDrag = (event) => {
    if (event.button !== 0 || event.target.closest('button, input, select, a, [contenteditable]')) return;
    const rect = panelRef.current.getBoundingClientRect();
    panelDragRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    event.preventDefault();
    setPanelDragging(true);
  };
  const dragPanel = (event) => {
    if (!panelDragRef.current) return;
    movePanel(event.clientX - panelDragRef.current.x, event.clientY - panelDragRef.current.y);
  };
  const stopPanelDrag = () => {
    panelDragRef.current = null;
    setPanelDragging(false);
  };
  const movePanelWithKeyboard = (event) => {
    if (event.target !== event.currentTarget) return;
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const rect = panelRef.current.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 10;
    movePanel(rect.left + direction[0] * step, rect.top + direction[1] * step);
  };
  const [saveState, setSaveState] = useState('Saved');
  const [imageProgress, setImageProgress] = useState(null);
  const [imageError, setImageError] = useState('');
  const [imageNotice, setImageNotice] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState(100);
  const [imageAlign, setImageAlign] = useState('center');

  const selectedNote = notes.find((note) => note.id === selectedId) || notes[0];
  currentNotesRef.current = { notes, id: selectedNote?.id };
  const overview = useMemo(() => {
    const tags = {}, sources = {}, courses = {}, lectures = {}, tests = {};
    notes.forEach((note) => {
      note.tags.forEach((tag) => { tags[tag] = (tags[tag] || 0) + 1; });
      const category = note.source?.category || 'Unlinked';
      sources[category] = (sources[category] || 0) + 1;
      if (note.source?.course) courses[note.source.course] = (courses[note.source.course] || 0) + 1;
      if (note.source?.lectureId) lectures[note.source.lectureId] = (lectures[note.source.lectureId] || 0) + 1;
      if (note.source?.questionId) tests[note.source.questionId] = (tests[note.source.questionId] || 0) + 1;
    });
    return { tags, sources, courses, lectures, tests };
  }, [notes]);
  const visibleNotes = useMemo(() => notes
    .filter((note) => `${note.title} ${note.content.replace(/<[^>]+>/g, ' ')} ${note.tags.join(' ')} ${note.source?.category || ''}`.toLowerCase().includes(query.toLowerCase()))
    .filter((note) => !tagFilter || note.tags.includes(tagFilter))
    .filter((note) => !sourceFilter || [note.source?.category, note.source?.course, note.source?.lectureId, note.source?.questionId].includes(sourceFilter))
    .slice()
    .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : b.updatedAt - a.updatedAt), [notes, query, sort, tagFilter, sourceFilter]);

  useEffect(() => {
    if (!selectedId && notes[0]) setSelectedId(notes[0].id);
  }, [notes, selectedId]);

  useEffect(() => {
    if (!selectedNote) return;
    const editor = editorRef.current;
    if (editor && sanitizeNoteHtml(editor.innerHTML) !== selectedNote.content) editor.innerHTML = sanitizeNoteHtml(selectedNote.content);
    const activeImages = new Set([...editor.querySelectorAll('img[data-image-id]')].map((image) => image.dataset.imageId));
    imageUrlsRef.current.forEach((url, id) => {
      if (!activeImages.has(id)) { URL.revokeObjectURL(url); imageUrlsRef.current.delete(id); }
    });
    let cancelled = false;
    editor?.querySelectorAll('img[data-image-id]').forEach(async (image) => {
      try {
        const id = image.dataset.imageId;
        let url = imageUrlsRef.current.get(id);
        if (!url) {
          const record = await getNoteImage(id);
          if (cancelled) return;
          url = URL.createObjectURL(record.blob);
          imageUrlsRef.current.set(id, url);
        }
        image.src = url;
        image.tabIndex = 0;
      } catch (error) { if (!cancelled) setImageError(error.message); }
    });
    return () => { cancelled = true; };
  }, [selectedNote]);

  useEffect(() => { setSelectedImage(null); setImageError(''); }, [selectedNote?.id]);
  useEffect(() => () => { imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  const persist = useCallback((nextNotes) => {
    try {
      localStorage.setItem(noteStorageKey(currentUser?.uid), JSON.stringify(nextNotes));
      setSaveState('Saved');
    } catch {
      setSaveState('Storage unavailable');
      showToast('Notes could not be saved in this browser.', 'error');
    }
  }, [currentUser?.uid, showToast]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);
  useEffect(() => {
    const flush = () => {
      clearTimeout(saveTimerRef.current);
      if (currentNotesRef.current?.notes) persist(currentNotesRef.current.notes);
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', flush); };
  }, [persist]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setLibraryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const move = (event) => {
      if (dragRef.current && (Math.abs(event.clientX - dragRef.current.startX) > 5 || Math.abs(event.clientY - dragRef.current.startY) > 5)) {
        dragRef.current.moved = true;
      }
      const width = triggerRef.current?.offsetWidth || 100;
      const height = triggerRef.current?.offsetHeight || 44;
      const next = {
        right: Math.max(8, Math.min(window.innerWidth - width - 8, window.innerWidth - event.clientX - width / 2)),
        bottom: Math.max(8, Math.min(window.innerHeight - height - 8, window.innerHeight - event.clientY - height / 2))
      };
      setPosition(next);
    };
    const stop = () => {
      suppressTriggerClickRef.current = Boolean(dragRef.current?.moved);
      try { localStorage.setItem(`${POSITION_PREFIX}${currentUser?.uid || 'guest'}`, JSON.stringify(position)); } catch { /* best effort */ }
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); };
  }, [isDragging, position, currentUser?.uid]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const frame = window.requestAnimationFrame(() => editorRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const updateNote = (changes) => {
    if (!selectedNote) return;
    const next = notes.map((note) => note.id === selectedNote.id ? { ...note, ...changes, updatedAt: Date.now() } : note);
    setNotes(next);
    setSaveState('Saving…');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persist(next), 450);
  };

  const createNote = () => {
    clearTimeout(saveTimerRef.current);
    const note = normalizeNote({ ...makeNote(), source: captureSource(location, activeCourse, activeTerm, activeTool) });
    const next = [note, ...notes];
    setNotes(next);
    setSelectedId(note.id);
    persist(next);
    setQuery('');
  };

  const updateSource = (changes) => updateNote({ source: selectedNote?.source ? { ...selectedNote.source, ...changes } : { ...captureSource(location, activeCourse, activeTerm, activeTool), ...changes } });
  const addTag = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const tag = tagDraft.trim().replace(/^#/, '').slice(0, 32);
    if (tag && !selectedNote.tags.includes(tag)) updateNote({ tags: [...selectedNote.tags, tag] });
    setTagDraft('');
  };
  const removeTag = (tag) => updateNote({ tags: selectedNote.tags.filter((item) => item !== tag) });

  const startDrag = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const exportCurrent = async (type) => {
    if (!selectedNote) return;
    setExportOpen(false);
    try {
      if (type === 'md') await exportMarkdown(selectedNote);
      if (type === 'pdf') await exportPdf(selectedNote);
      if (type === 'docx') await exportDocx(selectedNote);
    } catch (error) { showToast(`Export failed: ${error.message}`, 'error'); }
  };

  const rememberImageRange = () => {
    const selection = window.getSelection();
    imageRangeRef.current = selection?.rangeCount && editorRef.current?.contains(selection.anchorNode) ? selection.getRangeAt(0).cloneRange() : null;
  };

  const insertImages = async (files) => {
    if (imageBusyRef.current) { setImageError('Please wait for the current image to finish saving.'); return; }
    if (!files.length) return;
    if (files.length > 10) { setImageError('Insert up to 10 images at a time.'); return; }
    imageBusyRef.current = true;
    const noteId = selectedNote.id;
    setImageError('');
    setImageNotice('');
    try {
      for (const file of files) {
        setImageProgress({ percent: 0, message: `Checking ${file.name || 'clipboard image'}` });
        await storeNoteImage(file, currentUser?.uid, (progress) => {
          setImageProgress(progress);
          if (progress.percent === 100) setImageNotice(progress.message);
        }, (record) => {
        const figure = document.createElement('figure');
        figure.contentEditable = 'false';
        figure.dataset.align = 'center';
        figure.dataset.width = '100';
        figure.style.width = '100%';
        const image = document.createElement('img');
        image.dataset.imageId = record.id;
        image.alt = (file.name || 'Pasted image').slice(0, 500);
        figure.append(image);
        const current = currentNotesRef.current;
        let content;
        if (current.id === noteId) {
          const editor = editorRef.current;
          const selection = window.getSelection();
          let range = imageRangeRef.current;
          if (!range || !editor.contains(range.commonAncestorContainer)) {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
          }
          editor.focus();
          selection.removeAllRanges();
          selection.addRange(range);
          // Use the native editing command so inserting an image participates in Undo/Redo.
          document.execCommand('insertHTML', false, `${figure.outerHTML}<p><br></p>`);
          imageRangeRef.current = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
          content = sanitizeNoteHtml(editor.innerHTML);
        } else {
          const original = current.notes.find((note) => note.id === noteId);
          if (!original) return;
          content = sanitizeNoteHtml(`${original.content}${figure.outerHTML}<p><br></p>`);
        }
        const next = current.notes.map((note) => note.id === noteId ? { ...note, content, updatedAt: Date.now() } : note);
        clearTimeout(saveTimerRef.current);
        currentNotesRef.current = { ...current, notes: next };
        setNotes(next);
        persist(next);
        });
      }
    } catch (error) { setImageError(error.message); }
    finally { imageBusyRef.current = false; setImageProgress(null); }
  };

  const pasteContent = (event) => {
    const data = event.clipboardData;
    const files = [...(data?.items || [])].filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter(Boolean);
    if (files.length) {
      event.preventDefault(); rememberImageRange(); void insertImages(files); return;
    }
    const html = data?.getData('text/html');
    if (html) {
      event.preventDefault();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const embedded = [...parsed.querySelectorAll('img')].map((image) => image.getAttribute('src') || '').filter((src) => /^data:image\/(png|jpeg|webp|gif);base64,/i.test(src));
      if (embedded.length) {
        try {
          const imageFiles = embedded.map((src) => {
            if (src.length > 14 * 1024 * 1024) throw new Error('Images must be smaller than 10 MB.');
            const [header, base64] = src.split(',');
            const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
            return new File([bytes], 'Pasted image', { type: header.slice(5, header.indexOf(';')).toLowerCase() });
          });
          rememberImageRange(); void insertImages(imageFiles);
        } catch (error) { setImageError(error.message); }
        return;
      }
      document.execCommand('insertHTML', false, sanitizeNoteHtml(html));
      updateNote({ content: sanitizeNoteHtml(editorRef.current.innerHTML) });
    }
  };
  const dropImages = (event) => {
    event.preventDefault();
    const files = [...event.dataTransfer.files];
    if (!files.length) return;
    const caret = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    const selection = window.getSelection();
    if (caret && editorRef.current.contains(caret.commonAncestorContainer)) {
      selection.removeAllRanges(); selection.addRange(caret);
    } else {
      const point = document.caretPositionFromPoint?.(event.clientX, event.clientY);
      if (point && editorRef.current.contains(point.offsetNode)) {
        const range = document.createRange(); range.setStart(point.offsetNode, point.offset); range.collapse(true);
        selection.removeAllRanges(); selection.addRange(range);
      }
    }
    rememberImageRange(); void insertImages(files);
  };

  const selectImage = (event) => {
    const image = event.target.closest('img[data-image-id]');
    const figure = image?.closest('figure');
    if (!figure) { setSelectedImage(null); return; }
    setSelectedImage(image.dataset.imageId);
    setImageCaption(figure.querySelector('figcaption')?.textContent || '');
    setImageAlt(image.alt);
    setImageWidth(Number(figure.dataset.width) || 100);
    setImageAlign(figure.dataset.align || 'center');
  };
  const editImage = (changes) => {
    const image = [...editorRef.current.querySelectorAll('img[data-image-id]')].find((item) => item.dataset.imageId === selectedImage);
    const figure = image?.closest('figure');
    if (!figure) { setSelectedImage(null); return; }
    if (changes.remove) {
      const range = document.createRange(); range.selectNode(figure);
      const selection = window.getSelection(); editorRef.current.focus();
      selection.removeAllRanges(); selection.addRange(range);
      document.execCommand('delete');
      setSelectedImage(null);
    }
    else {
      if (changes.width !== undefined) { figure.dataset.width = String(changes.width); figure.style.width = `${changes.width}%`; setImageWidth(changes.width); }
      if (changes.align !== undefined) { figure.dataset.align = changes.align; setImageAlign(changes.align); }
      if (changes.alt !== undefined) { image.alt = changes.alt; setImageAlt(changes.alt); }
      if (changes.caption !== undefined) {
        let caption = figure.querySelector('figcaption');
        if (!caption) { caption = document.createElement('figcaption'); figure.append(caption); }
        caption.textContent = changes.caption;
        if (!changes.caption) caption.remove();
        setImageCaption(changes.caption);
      }
    }
    updateNote({ content: sanitizeNoteHtml(editorRef.current.innerHTML) });
  };

  const deleteNote = () => {
    if (!selectedNote) return;
    showConfirm(`Delete “${selectedNote.title || 'Untitled note'}”? This cannot be undone.`, () => {
      clearTimeout(saveTimerRef.current);
      const remaining = notes.filter((note) => note.id !== selectedNote.id);
      const next = remaining.length ? remaining : [makeNote()];
      setNotes(next);
      setSelectedId(next[0].id);
      persist(next);
    });
  };

  const runCommand = (command, value = null) => (event) => {
    event.preventDefault();
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateNote({ content: sanitizeNoteHtml(editorRef.current?.innerHTML) });
  };

  const insertLink = (event) => {
    event.preventDefault();
    const url = window.prompt('Paste a URL');
    if (url) runCommand('createLink', url)(event);
  };
  const changeBlock = (event) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, event.target.value);
    updateNote({ content: sanitizeNoteHtml(editorRef.current?.innerHTML) });
  };

  return (
    <>
      {!isOpen && <button
        type="button"
        className={`zc-notes-floating-trigger ${isOpen ? 'is-open' : ''}`}
        ref={triggerRef}
        style={{ right: `${position.right}px`, bottom: `${position.bottom}px` }}
        onClick={() => {
          if (suppressTriggerClickRef.current) {
            suppressTriggerClickRef.current = false;
            return;
          }
          setIsOpen(true);
          setLibraryOpen(false);
        }}
        onPointerDown={startDrag}
        aria-label={isOpen ? 'Notes panel open' : 'Open Notes'}
        aria-expanded={isOpen}
        title="Open Notes"
      >
        <FileText size={19} />
        <span>Notes</span>
      </button>}
    <main ref={panelRef} hidden={!isOpen} style={panelPosition && Number.isFinite(panelPosition.left) && Number.isFinite(panelPosition.top) ? { left: panelPosition.left, top: panelPosition.top, right: "auto", bottom: "auto" } : undefined} className={`zc-notes-shell zc-notes-floating-panel ${fullscreen ? 'is-expanded' : ''} ${libraryOpen ? 'library-open' : ''} ${panelDragging ? 'is-dragging' : ''}`} role="dialog" aria-label="Floating Notes">
      <aside className="zc-notes-sidebar" aria-label="Notes library">
        <div className="zc-notes-sidebar-head">
          <div><span className="zc-notes-eyebrow">Workspace</span><h1>Notes</h1></div>
          <div className="zc-notes-sidebar-actions"><button type="button" className="zc-notes-new" onClick={createNote} aria-label="Create a new note" title="New note"><FileText size={16} /><span>New note</span></button><button type="button" className="zc-notes-icon-button" onClick={() => setLibraryOpen(false)} aria-label="Close notes library" title="Close notes library"><X size={15} /></button></div>
        </div>
        <label className="zc-notes-search"><span className="sr-only">Search notes</span><FileText size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes…" /></label>
        <div className="zc-notes-list-toolbar"><span>{visibleNotes.length} {visibleNotes.length === 1 ? 'note' : 'notes'}</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort notes"><option value="updated">Last edited</option><option value="title">Title</option></select></div>
        <div className="zc-notes-overview" aria-label="Notes Overview"><span className="zc-notes-overview-label">Overview</span><button type="button" className={!tagFilter && !sourceFilter ? 'active' : ''} onClick={() => { setTagFilter(''); setSourceFilter(''); }}>All <b>{notes.length}</b></button>{Object.entries(overview.sources).map(([source, count]) => <button type="button" key={source} className={sourceFilter === source ? 'active' : ''} onClick={() => { setSourceFilter(source); setTagFilter(''); }}>{source} <b>{count}</b></button>)}{Object.entries(overview.courses).slice(0, 3).map(([course, count]) => <button type="button" key={`course-${course}`} className={sourceFilter === course ? 'active' : ''} onClick={() => { setSourceFilter(course); setTagFilter(''); }}>{course} <b>{count}</b></button>)}{Object.entries(overview.lectures).slice(0, 3).map(([lecture, count]) => <button type="button" key={`lecture-${lecture}`} className={sourceFilter === lecture ? 'active' : ''} onClick={() => { setSourceFilter(lecture); setTagFilter(''); }}>Lecture {lecture} <b>{count}</b></button>)}{Object.entries(overview.tests).slice(0, 3).map(([test, count]) => <button type="button" key={`test-${test}`} className={sourceFilter === test ? 'active' : ''} onClick={() => { setSourceFilter(test); setTagFilter(''); }}>Test {test} <b>{count}</b></button>)}{Object.entries(overview.tags).slice(0, 5).map(([tag, count]) => <button type="button" key={tag} className={tagFilter === tag ? 'active' : ''} onClick={() => { setTagFilter(tag); setSourceFilter(''); }}>#{tag} <b>{count}</b></button>)}</div>
        <div className="zc-notes-list">
          {visibleNotes.map((note) => <button type="button" key={note.id} className={`zc-note-list-item ${note.id === selectedNote?.id ? 'selected' : ''}`} onClick={() => setSelectedId(note.id)}><strong>{note.title || 'Untitled note'}</strong><span>{formatDate(note.updatedAt)}</span><p>{note.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || 'Empty note'}</p></button>)}
          {!visibleNotes.length && <div className="zc-notes-empty"><FileText size={22} /><span>No matching notes</span></div>}
        </div>
      </aside>

      <section className="zc-notes-editor-panel" aria-label="Note editor">
        <header className="zc-notes-editor-header" tabIndex={0} aria-label="Move Notes popup with arrow keys; Shift moves faster" onKeyDown={movePanelWithKeyboard} onPointerDown={startPanelDrag} onPointerMove={dragPanel} onPointerUp={stopPanelDrag} onPointerCancel={stopPanelDrag} onLostPointerCapture={stopPanelDrag}><div className="zc-notes-breadcrumb"><span>Notes</span><span>/</span><strong>{selectedNote?.title || 'Untitled note'}</strong></div><div className="zc-notes-panel-controls"><button type="button" className="zc-notes-icon-button zc-notes-library-toggle" onClick={() => setLibraryOpen((value) => !value)} aria-label={libraryOpen ? 'Close notes library' : 'Open notes library'} title={libraryOpen ? 'Close library' : 'Open library'}><FileText size={16} /></button><div className="zc-notes-export-wrap"><button type="button" className="zc-notes-icon-button" onClick={() => setExportOpen((value) => !value)} aria-haspopup="menu" aria-expanded={exportOpen} aria-label="Export note" title="Export note"><Download size={16} /></button>{exportOpen && <div className="zc-notes-export-menu" role="menu"><button type="button" onClick={() => exportCurrent('md')}>Markdown <span>.md</span></button><button type="button" onClick={() => exportCurrent('pdf')}>PDF <span>.pdf</span></button><button type="button" onClick={() => exportCurrent('docx')}>Word document <span>.docx</span></button></div>}</div><button type="button" className="zc-notes-icon-button" onClick={() => setFullscreen((value) => !value)} aria-label={fullscreen ? 'Collapse Notes' : 'Expand Notes'} title={fullscreen ? 'Collapse Notes' : 'Expand Notes'}>{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button><button type="button" className="zc-notes-icon-button" onClick={() => { setIsOpen(false); setLibraryOpen(false); }} aria-label="Close Notes" title="Close Notes"><X size={17} /></button></div></header>
        {selectedNote && <>
          <div className="zc-notes-title-row"><input className="zc-notes-title-input" value={selectedNote.title} onChange={(event) => updateNote({ title: event.target.value })} aria-label="Note title" placeholder="Untitled note" /><button type="button" className="zc-notes-icon-button danger" onClick={deleteNote} aria-label="Delete note" title="Delete note"><Trash2 size={17} /></button></div>
          <div className="zc-notes-details">
            <div className="zc-notes-tags"><span>Tags</span>{selectedNote.tags.map((tag) => <button type="button" key={tag} className="zc-notes-tag" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>#{tag} ×</button>)}<input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={addTag} placeholder="Add tag + Enter" aria-label="Add note tag" /></div>
            <div className="zc-notes-source"><span>Source</span>{selectedNote.source ? <><span className="zc-notes-source-value">{sourceLabel(selectedNote.source)}</span>{selectedNote.source.path && <button type="button" className="zc-notes-back-source" onClick={() => navigate(selectedNote.source.path)}>Back to source</button>}<button type="button" className="zc-notes-text-button" onClick={() => setSourceEditing((value) => !value)}>{sourceEditing ? 'Done' : 'Edit'}</button><button type="button" className="zc-notes-text-button danger" onClick={() => updateNote({ source: null })}>Remove</button></> : <><span className="zc-notes-source-value muted">No source linked</span><button type="button" className="zc-notes-text-button" onClick={() => { updateSource({}); setSourceEditing(true); }}>Add</button></>}</div>
            {sourceEditing && <div className="zc-notes-source-edit"><input value={selectedNote.source?.label || ''} onChange={(event) => updateSource({ label: event.target.value })} placeholder="Source label" aria-label="Source label" /><select value={selectedNote.source?.category || 'Workspace'} onChange={(event) => updateSource({ category: event.target.value })} aria-label="Source category"><option>Lecture</option><option>Learn</option><option>Test</option><option>Cheatsheet</option><option>Workspace</option></select></div>}
          </div>
          <div className="zc-notes-toolbar" role="toolbar" aria-label="Formatting controls">
            <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden aria-label="Upload note images" onChange={(event) => { void insertImages([...event.target.files]); event.target.value = ''; }} />
            <button type="button" className="zc-notes-tool" aria-label="Insert image" title="Insert image (PNG, JPEG, WebP, GIF; up to 10 MB)" disabled={Boolean(imageProgress)} onMouseDown={(event) => { event.preventDefault(); rememberImageRange(); }} onClick={() => { rememberImageRange(); imageInputRef.current.click(); }}><ImagePlus size={16} /></button>
            <div className="zc-notes-tool-group"><ToolbarButton label="Undo" icon={Undo2} onMouseDown={runCommand('undo')} /><ToolbarButton label="Redo" icon={Redo2} onMouseDown={runCommand('redo')} /></div>
            <span className="zc-notes-divider" />
            <label className="zc-notes-format-select"><Heading2 size={15} /><select defaultValue="p" onChange={changeBlock} aria-label="Text style"><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select><ChevronDown size={13} /></label>
            <span className="zc-notes-divider" />
            <div className="zc-notes-tool-group"><ToolbarButton label="Bold" icon={Bold} onMouseDown={runCommand('bold')} /><ToolbarButton label="Italic" icon={Italic} onMouseDown={runCommand('italic')} /><ToolbarButton label="Underline" icon={Underline} onMouseDown={runCommand('underline')} /><ToolbarButton label="Strikethrough" icon={Strikethrough} onMouseDown={runCommand('strikeThrough')} /><ToolbarButton label="Add hyperlink" icon={ExternalLink} onMouseDown={insertLink} /><ToolbarButton label="Inline code" icon={Code2} onMouseDown={runCommand('formatBlock', 'code')} /></div>
            <span className="zc-notes-divider" /><ToolbarButton label="More formatting" icon={MoreHorizontal} active={overflowOpen} onMouseDown={(event) => { event.preventDefault(); setOverflowOpen((value) => !value); }} />
            {overflowOpen && <div className="zc-notes-overflow-menu"><ToolbarButton label="Bulleted list" icon={List} onMouseDown={runCommand('insertUnorderedList')} /><ToolbarButton label="Numbered list" icon={ListOrdered} onMouseDown={runCommand('insertOrderedList')} /><ToolbarButton label="Blockquote" icon={Quote} onMouseDown={runCommand('formatBlock', 'blockquote')} /><ToolbarButton label="Code block" icon={Code2} onMouseDown={runCommand('formatBlock', 'pre')} /><ToolbarButton label="Horizontal rule" icon={MinusIcon} onMouseDown={runCommand('insertHorizontalRule')} /><ToolbarButton label="Clear formatting" icon={X} onMouseDown={runCommand('removeFormat')} /></div>}
          </div>
          {imageProgress && <div className="zc-notes-image-status" role="status"><progress value={imageProgress.percent} max="100" aria-label="Image upload progress" /><span>{imageProgress.message} · {imageProgress.percent}%</span></div>}
          {!imageProgress && imageNotice && <div className="zc-notes-image-status" role="status">{imageNotice}</div>}
          {imageError && <div className="zc-notes-image-error" role="alert">{imageError}<button type="button" aria-label="Dismiss image error" onClick={() => setImageError('')}><X size={14} /></button></div>}
          {selectedImage && <div className="zc-notes-image-controls" role="group" aria-label="Image settings">
            <label>Width <input type="range" min="10" max="100" value={imageWidth} aria-label="Image width" onChange={(event) => editImage({ width: Number(event.target.value) })} /><span>{imageWidth}%</span></label>
            <label>Align <select value={imageAlign} aria-label="Image alignment" onChange={(event) => editImage({ align: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
            <label>Caption <input value={imageCaption} maxLength={500} aria-label="Image caption" placeholder="Optional caption" onChange={(event) => editImage({ caption: event.target.value })} /></label>
            <label>Alt text <input value={imageAlt} maxLength={500} aria-label="Image alt text" onChange={(event) => editImage({ alt: event.target.value })} /></label>
            <button type="button" className="zc-notes-text-button danger" onClick={() => editImage({ remove: true })}>Delete image</button>
            <button type="button" className="zc-notes-text-button" onClick={() => { setSelectedImage(null); editorRef.current.focus(); }}>Done</button>
          </div>}
          <div className="zc-notes-editor-wrap"><div ref={editorRef} className="zc-notes-editor" contentEditable suppressContentEditableWarning role="textbox" aria-label="Note content" data-placeholder="Start writing…" onPaste={pasteContent} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={dropImages} onClick={selectImage} onFocusCapture={selectImage} onInput={(event) => updateNote({ content: sanitizeNoteHtml(event.currentTarget.innerHTML) })} onKeyDown={(event) => { if (event.target.tagName === "IMG" && ["Delete", "Backspace"].includes(event.key)) { event.preventDefault(); editImage({ remove: true }); return; } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); clearTimeout(saveTimerRef.current); persist(notes); } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); const url = window.prompt('Paste a URL'); if (url) { document.execCommand('createLink', false, url); updateNote({ content: sanitizeNoteHtml(editorRef.current?.innerHTML) }); } } }} /></div>
          <footer className="zc-notes-footer"><span className={`zc-notes-save-status ${saveState === 'Saving…' ? 'saving' : ''}`}>{saveState === 'Saved' ? <Check size={13} /> : null}{saveState}</span><span>Rich text is saved locally to this account</span></footer>
        </>}
      </section>
    </main>
    </>
  );
}

function MinusIcon(props) { return <span {...props} style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>−</span>; }

export default Notes;
