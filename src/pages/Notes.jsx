import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Code2,
  Download,
  FileText,
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
import { auth, db } from '../config/firebase';
import { exportDocx, exportMarkdown, exportPdf } from '../utils/notesExport';
import { getNoteImage, storeNoteImage, syncPendingNoteImages, deleteUnusedNoteImages } from '../utils/notesImages';
import { imageStorage, imageCache } from '../utils/imageService';
import { createMigrationEngine } from '../utils/migration/legacyMigration';
import { createFirestoreMigrationAdapter } from '../utils/migration/firestoreAdapter';
import {
  EMPTY_CONTENT,
  sanitizeNoteHtml,
  normalizeNote,
  makeNote,
  loadLocalNotes,
  saveLocalNotes,
  syncNoteToFirestore,
  deleteNoteInFirestore,
  subscribeNotesFromFirestore,
  noteStorageKey,
  isValidNoteUrl,
  createLinkHtml,
  linkifyPlainTextToHtml,
  linkifyHtmlFragment,
  applyBlockFormatToEditor,
  toggleInlineCodeInEditor,
  toggleInlineTagInEditor,
  computeEditorToolbarState
} from '../utils/notesStorage';
import '../index.css';

export { sanitizeNoteHtml };

const POSITION_PREFIX = 'zerocoder_notes_position_';
const DEFAULT_POSITION = { right: 24, bottom: 24 };

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

const EMPTY_TOOLBAR_STATE = {
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

function ToolbarButton({ label, text = '', icon: Icon, onMouseDown, active = null, className = '' }) {
  return (
    <button
      type="button"
      className={`zc-notes-tool ${active ? 'active' : ''} ${className}`.trim()}
      aria-label={label}
      aria-pressed={typeof active === 'boolean' ? active : undefined}
      title={label}
      onMouseDown={onMouseDown}
    >
      {Icon ? <Icon size={16} strokeWidth={1.8} /> : <span>{text}</span>}
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
  const editorWrapRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const imageResizeDragRef = useRef(null);
  const pendingImageRetryRef = useRef(new Set());
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
  const [notes, setNotes] = useState(() => loadLocalNotes(currentUser?.uid));
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
  const [toolbarState, setToolbarState] = useState(EMPTY_TOOLBAR_STATE);
  const [resizerRect, setResizerRect] = useState(null);

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
    let pendingLocalDetected = false;
    editor?.querySelectorAll('img[data-image-id]').forEach(async (image) => {
      try {
        const id = image.dataset.imageId;
        let url = imageUrlsRef.current.get(id);
        if (!url) {
          const record = await getNoteImage(id, currentUser?.uid);
          if (cancelled) return;
          if (
            !record.cloudSynced
            && currentUser?.uid
            && currentUser.uid !== 'guest'
            && !pendingLocalDetected
          ) {
            pendingLocalDetected = true;
            const retryKey = `${currentUser.uid}:${selectedNote.id}:${id}`;
            if (!pendingImageRetryRef.current.has(retryKey) && (typeof navigator === 'undefined' || navigator.onLine)) {
              pendingImageRetryRef.current.add(retryKey);
              void syncPendingNoteImages(selectedNote, currentUser.uid).then((imgRes) => {
                if (!cancelled && imgRes?.changed) {
                  setNotes((prev) => {
                    const next = prev.map((n) => (n.id === selectedNote.id ? { ...n, content: imgRes.content, imageIds: imgRes.imageIds, updatedAt: Date.now() } : n));
                    saveLocalNotes(currentUser.uid, next);
                    return next;
                  });
                }
              }).catch(() => { });
            }
          }
          url = URL.createObjectURL(record.blob);
          imageUrlsRef.current.set(id, url);
        }
        image.src = url;
        image.tabIndex = 0;
      } catch (error) { if (!cancelled) setImageError(error.message); }
    });
    return () => { cancelled = true; };
  }, [selectedNote, currentUser?.uid]);

  useEffect(() => {
    setSelectedImage(null);
    setResizerRect(null);
    setImageError('');
    setToolbarState(EMPTY_TOOLBAR_STATE);
    savedSelectionRef.current = null;
  }, [selectedNote?.id]);
  useEffect(() => () => { imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); imageUrlsRef.current.clear(); }, []);

  useEffect(() => {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current.clear();
    setPosition(loadPosition(currentUser?.uid));
    try {
      setPanelPositions(JSON.parse(localStorage.getItem(`${POSITION_PREFIX}popup_${currentUser?.uid || 'guest'}`)) || {});
    } catch {
      setPanelPositions({});
    }
    setQuery('');
    setTagFilter('');
    setSourceFilter('');
    setSelectedImage(null);
    setImageError('');
    setImageNotice('');
  }, [currentUser?.uid]);

  const persist = useCallback((nextNotes, targetId = currentNotesRef.current?.id) => {
    try {
      saveLocalNotes(currentUser?.uid, nextNotes);
      setSaveState('Saved');
    } catch {
      setSaveState('Storage unavailable');
      showToast('Notes could not be saved in this browser.', 'error');
    }

    if (currentUser?.uid && currentUser?.role !== 'Unauthorized' && db && (typeof navigator === 'undefined' || navigator.onLine)) {
      const active = (targetId && nextNotes.find((n) => n.id === targetId)) || nextNotes[0];
      if (active) {
        const submittedUpdatedAt = Number(active.updatedAt) || 0;
        syncNoteToFirestore(db, currentUser.uid, active)
          .then((synced) => {
            setSaveState('Synced');
            setNotes((prev) => {
              let updated = prev.map((item) => {
                if (item.id !== synced.id) return item;
                if (synced.conflictCopy) {
                  return { ...item, ...synced, conflictCopy: undefined };
                }
                const localEditedWhileInFlight =
                  (Number(item.updatedAt) || 0) > submittedUpdatedAt ||
                  item.content !== active.content ||
                  item.title !== active.title;
                if (localEditedWhileInFlight) {
                  return {
                    ...item,
                    revision: Math.max(Number(item.revision) || 1, Number(synced.revision) || 1)
                  };
                }
                return { ...item, ...synced, conflictCopy: undefined };
              });
              if (synced.conflictCopy && !updated.some((item) => item.id === synced.conflictCopy.id)) {
                updated = [synced.conflictCopy, ...updated];
                showToast('Remote changes detected; your edits were saved as a conflict copy.', 'info');
              }
              saveLocalNotes(currentUser.uid, updated);
              return updated;
            });
          })
          .catch((err) => {
            console.warn('Firestore note sync error:', err);
            setSaveState('Saved locally');
          });
      }
    }
  }, [currentUser?.uid, currentUser?.role, showToast]);

  const runCloudMigrationAndFlush = useCallback(async (uid, { adoptGuest = false } = {}) => {
    if (!uid || uid === 'guest' || !db || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    const isNonEmptyNote = (n) => n && (
      (n.title && n.title !== 'New note') ||
      (n.content && n.content !== EMPTY_CONTENT) ||
      (Array.isArray(n.tags) && n.tags.length > 0) ||
      Boolean(n.source)
    );

    try {
      const userKey = noteStorageKey(uid);
      const guestAdoptedKey = `zerocoder_notes_guest_adopted_${uid}`;
      if (adoptGuest && !localStorage.getItem(guestAdoptedKey)) {
        const rawGuest = localStorage.getItem(noteStorageKey('guest'));
        const parsedGuest = rawGuest ? JSON.parse(rawGuest) : [];
        const meaningfulGuest = Array.isArray(parsedGuest) ? parsedGuest.map(normalizeNote).filter((n) => !n.deleted && isNonEmptyNote(n)) : [];
        if (meaningfulGuest.length > 0) {
          const rawExisting = localStorage.getItem(userKey);
          const existingLocal = rawExisting ? JSON.parse(rawExisting).map(normalizeNote).filter((n) => !n.deleted) : [];
          const existingIds = new Set(existingLocal.map((n) => n.id));
          const mergedLocal = [...existingLocal];
          for (const g of meaningfulGuest) {
            if (!existingIds.has(g.id)) mergedLocal.push(g);
          }
          localStorage.setItem(userKey, JSON.stringify(mergedLocal));
          setNotes(mergedLocal.length ? mergedLocal : [makeNote()]);
        }
        localStorage.setItem(guestAdoptedKey, '1');
      }

      const rawUser = localStorage.getItem(userKey);
      const parsedUser = rawUser ? JSON.parse(rawUser) : [];
      const persistedNotes = Array.isArray(parsedUser) ? parsedUser.map(normalizeNote).filter((n) => !n.deleted) : [];
      if (persistedNotes.length === 0) return;

      // 1. Upgrade any offline-cached or inline images in local notes to R2
      let anyImageUpdated = false;
      const upgradedNotes = [];
      for (const note of persistedNotes) {
        const imgRes = await syncPendingNoteImages(note, uid);
        if (imgRes.changed) {
          anyImageUpdated = true;
          upgradedNotes.push({ ...note, content: imgRes.content, imageIds: imgRes.imageIds, updatedAt: Date.now() });
        } else {
          upgradedNotes.push(note);
        }
      }
      if (anyImageUpdated) {
        if (auth?.currentUser?.uid && auth.currentUser.uid !== uid) return;
        saveLocalNotes(uid, upgradedNotes);
        setNotes((prev) => prev.map((n) => upgradedNotes.find((u) => u.id === n.id) || n));
      }

      // 2. Run transactional idempotent migration to Firestore & R2
      const engine = createMigrationEngine({
        auth: auth?.currentUser?.uid === uid ? auth : { currentUser: { uid } },
        imageStorage,
        imageCache,
        firestore: createFirestoreMigrationAdapter(db),
        localStore: localStorage
      });
      await engine.migrateNotes(uid, { adoptGuest: false });

      // 3. Reconcile any remaining offline edits or conflicts cleanly
      const conflictCopies = [];
      for (const note of upgradedNotes) {
        if (auth?.currentUser?.uid && auth.currentUser.uid !== uid) return;
        if (!isNonEmptyNote(note) && upgradedNotes.length === 1) continue;
        const synced = await syncNoteToFirestore(db, uid, note).catch(() => null);
        if (synced?.conflictCopy) conflictCopies.push(synced.conflictCopy);
      }
      if (conflictCopies.length > 0 && (!auth?.currentUser?.uid || auth.currentUser.uid === uid)) {
        setNotes((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const merged = [...conflictCopies.filter((c) => !existingIds.has(c.id)), ...prev];
          saveLocalNotes(uid, merged);
          return merged;
        });
      }
      setSaveState('Synced');
    } catch (err) {
      console.warn('Notes cloud migration/sync deferred:', err);
    }
  }, []);

  useEffect(() => {
    const loaded = loadLocalNotes(currentUser?.uid);
    setNotes(loaded);
    setSelectedId(loaded[0]?.id || null);

    if (currentUser?.uid && currentUser?.role !== 'Unauthorized' && db) {
      let active = true;
      const unsub = subscribeNotesFromFirestore(db, currentUser.uid, (remoteNotes, deletedIds = []) => {
        if (!active) return;
        setNotes((prevLocal) => {
          const deletedSet = new Set(deletedIds);
          const merged = prevLocal.filter((l) => !deletedSet.has(l.id));
          remoteNotes.forEach((remote) => {
            const index = merged.findIndex((l) => l.id === remote.id);
            if (index === -1) {
              merged.push(remote);
            } else if ((remote.revision || 1) > (merged[index].revision || 1) || (remote.updatedAt || 0) > (merged[index].updatedAt || 0)) {
              merged[index] = remote;
            }
          });
          const nextLocal = merged.length ? merged : [makeNote()];
          saveLocalNotes(currentUser.uid, nextLocal);
          return nextLocal;
        });
      });

      void runCloudMigrationAndFlush(currentUser.uid, { adoptGuest: true });

      const handleOnline = () => {
        if (active) void runCloudMigrationAndFlush(currentUser.uid, { adoptGuest: false });
      };
      window.addEventListener('online', handleOnline);

      return () => {
        active = false;
        window.removeEventListener('online', handleOnline);
        unsub();
      };
    }
    return undefined;
  }, [currentUser?.uid, currentUser?.role, runCloudMigrationAndFlush]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);
  useEffect(() => {
    const flush = () => {
      clearTimeout(saveTimerRef.current);
      if (currentNotesRef.current?.notes) persist(currentNotesRef.current.notes, currentNotesRef.current.id);
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
    const targetId = selectedNote.id;
    const next = notes.map((note) => note.id === targetId ? { ...note, ...changes, updatedAt: Date.now() } : note);
    setNotes(next);
    setSaveState('Saving…');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persist(next, targetId), 450);
  };

  const createNote = () => {
    clearTimeout(saveTimerRef.current);
    const note = normalizeNote({ ...makeNote(), source: captureSource(location, activeCourse, activeTerm, activeTool) });
    const next = [note, ...notes];
    setNotes(next);
    setSelectedId(note.id);
    persist(next, note.id);
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
    const payload = { ...selectedNote, ownerUid: currentUser?.uid };
    try {
      if (type === 'md') await exportMarkdown(payload);
      if (type === 'pdf') await exportPdf(payload);
      if (type === 'docx') await exportDocx(payload);
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
            const markup = `${figure.outerHTML}<p><br></p>`;
            const beforeInsert = editor.innerHTML;
            if (typeof document.execCommand === 'function') {
              try {
                document.execCommand('insertHTML', false, markup);
              } catch {
                // Fall back to Range insertion below
              }
            }
            if (editor.innerHTML === beforeInsert) {
              range.deleteContents();
              const template = document.createElement('template');
              template.innerHTML = markup;
              const last = template.content.lastChild;
              range.insertNode(template.content);
              if (last) {
                const after = document.createRange();
                after.setStartAfter(last);
                after.collapse(true);
                selection.removeAllRanges();
                selection.addRange(after);
              }
            }
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
          persist(next, noteId);
        }, noteId);
      }
    } catch (error) { setImageError(error.message); }
    finally { imageBusyRef.current = false; setImageProgress(null); }
  };

  const saveEditorSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || typeof window === 'undefined') return null;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        const cloned = range.cloneRange();
        savedSelectionRef.current = cloned;
        return cloned;
      }
    }
    return savedSelectionRef.current && editor.contains(savedSelectionRef.current.commonAncestorContainer)
      ? savedSelectionRef.current
      : null;
  }, []);

  const refreshToolbarState = useCallback((explicitRange = null) => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = computeEditorToolbarState(editor, explicitRange || savedSelectionRef.current);
    setToolbarState((prev) => {
      if (
        prev.bold === next.bold &&
        prev.italic === next.italic &&
        prev.underline === next.underline &&
        prev.strikeThrough === next.strikeThrough &&
        prev.inlineCode === next.inlineCode &&
        prev.unorderedList === next.unorderedList &&
        prev.orderedList === next.orderedList &&
        prev.blockquote === next.blockquote &&
        prev.codeBlock === next.codeBlock &&
        prev.block === next.block
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onSelectionChange = () => {
      const editor = editorRef.current;
      if (!editor) return;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
        const range = selection.getRangeAt(0).cloneRange();
        savedSelectionRef.current = range;
        refreshToolbarState(range);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [isOpen, refreshToolbarState]);

  const measureSelectedImage = useCallback(() => {
    const editor = editorRef.current;
    const wrap = editorWrapRef.current;
    if (!editor || !wrap) {
      setResizerRect(null);
      return;
    }
    editor.querySelectorAll('figure[data-selected="true"]').forEach((fig) => fig.removeAttribute('data-selected'));
    if (!selectedImage) {
      setResizerRect(null);
      return;
    }
    const img = [...editor.querySelectorAll('img[data-image-id]')].find((item) => item.dataset.imageId === selectedImage);
    const figure = img?.closest('figure');
    if (!img || !figure) {
      setResizerRect(null);
      return;
    }
    figure.setAttribute('data-selected', 'true');
    const wrapRect = wrap.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const fallbackRect = figure.getBoundingClientRect();
    const targetRect = imgRect.width > 0 ? imgRect : fallbackRect;
    setResizerRect({
      top: targetRect.top - wrapRect.top + wrap.scrollTop,
      left: targetRect.left - wrapRect.left + wrap.scrollLeft,
      width: targetRect.width,
      height: targetRect.height,
      pxWidth: Math.round(targetRect.width || Number(figure.dataset.widthPx) || 0),
      pxHeight: Math.round(targetRect.height || Number(figure.dataset.heightPx) || 0),
      pctWidth: Number(figure.dataset.width) || 100
    });
  }, [selectedImage]);

  useLayoutEffect(() => {
    measureSelectedImage();
  }, [measureSelectedImage, selectedNote?.content, fullscreen, isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedImage) return undefined;
    const wrap = editorWrapRef.current;
    if (!wrap) return undefined;
    const onScrollOrResize = () => measureSelectedImage();
    wrap.addEventListener('scroll', onScrollOrResize);
    window.addEventListener('resize', onScrollOrResize);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScrollOrResize) : null;
    observer?.observe(wrap);
    if (editorRef.current) observer?.observe(editorRef.current);
    return () => {
      wrap.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      observer?.disconnect();
    };
  }, [isOpen, selectedImage, measureSelectedImage]);

  const insertHtmlIntoEditor = (html) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    let range = saveEditorSelection();
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);

    const beforeHtml = editor.innerHTML;
    let insertedWithExec = false;
    if (typeof document.execCommand === 'function') {
      try {
        document.execCommand('insertHTML', false, html);
        insertedWithExec = editor.innerHTML !== beforeHtml;
      } catch {
        insertedWithExec = false;
      }
    }
    if (!insertedWithExec) {
      range.deleteContents();
      const template = document.createElement('template');
      template.innerHTML = html;
      const frag = template.content;
      const lastChild = frag.lastChild;
      range.insertNode(frag);
      if (lastChild) {
        const afterRange = document.createRange();
        afterRange.setStartAfter(lastChild);
        afterRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(afterRange);
      }
    }
    saveEditorSelection();
    refreshToolbarState();
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
      const { html: linkedHtml } = linkifyHtmlFragment(html);
      insertHtmlIntoEditor(linkedHtml);
      updateNote({ content: sanitizeNoteHtml(editorRef.current.innerHTML) });
      return;
    }

    const plainText = data?.getData('text/plain') || '';
    const singleUrl = isValidNoteUrl(plainText);
    if (singleUrl) {
      event.preventDefault();
      const editor = editorRef.current;
      editor?.focus();
      const selection = window.getSelection();
      let range = saveEditorSelection();
      if (!range && editor) {
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      if (range && !range.collapsed && range.toString().trim()) {
        const anchor = document.createElement('a');
        anchor.setAttribute('href', singleUrl);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
        const extracted = range.extractContents();
        extracted.querySelectorAll?.('a').forEach((existingLink) => {
          while (existingLink.firstChild) {
            existingLink.parentNode.insertBefore(existingLink.firstChild, existingLink);
          }
          existingLink.remove();
        });
        anchor.appendChild(extracted);
        range.insertNode(anchor);
        const after = document.createRange();
        after.setStartAfter(anchor);
        after.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(after);
        saveEditorSelection();
        refreshToolbarState(after);
      } else {
        insertHtmlIntoEditor(createLinkHtml(singleUrl, singleUrl));
      }
      updateNote({ content: sanitizeNoteHtml(editorRef.current.innerHTML) });
      return;
    }

    const { html: linkedPlainHtml, urlCount } = linkifyPlainTextToHtml(plainText);
    if (urlCount > 0) {
      event.preventDefault();
      insertHtmlIntoEditor(linkedPlainHtml);
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

  const handleEditorClick = (event) => {
    selectImage(event);
    const clickedImage = event.target.closest('img[data-image-id]');
    if (!clickedImage) {
      const link = event.target.closest('a[href]');
      const sel = window.getSelection();
      if (link && (!sel || sel.isCollapsed)) {
        const validHref = isValidNoteUrl(link.getAttribute('href'));
        if (validHref) {
          event.preventDefault();
          window.open(validHref, '_blank', 'noopener,noreferrer');
        }
      }
    }
    saveEditorSelection();
    refreshToolbarState();
  };

  const startCornerResize = (handle, event) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    const editor = editorRef.current;
    const img = editor ? [...editor.querySelectorAll('img[data-image-id]')].find((item) => item.dataset.imageId === selectedImage) : null;
    const figure = img?.closest('figure');
    if (!editor || !img || !figure) return;

    event.preventDefault();
    event.stopPropagation();
    const imgRect = img.getBoundingClientRect();
    const figureRect = figure.getBoundingClientRect();
    const startWidth = Math.max(48, imgRect.width || figureRect.width || Number(figure.dataset.widthPx) || 240);
    const startHeight = Math.max(32, imgRect.height || figureRect.height || Number(figure.dataset.heightPx) || 180);
    const naturalRatio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : startWidth / startHeight;
    const maxEditorWidth = Math.max(120, editor.clientWidth - 8);
    imageResizeDragRef.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startWidth,
      startHeight,
      aspectRatio: Math.max(0.1, naturalRatio),
      maxEditorWidth
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const applyDrag = (moveEvent, commit = false) => {
      const drag = imageResizeDragRef.current;
      if (!drag) return;
      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;
      const hSign = handle.includes('w') ? -1 : 1;
      const vSign = handle.includes('n') ? -1 : 1;

      let nextWidth;
      let nextHeight;
      if (moveEvent.shiftKey) {
        nextWidth = Math.round(Math.max(48, Math.min(drag.maxEditorWidth, drag.startWidth + hSign * dx)));
        nextHeight = Math.round(Math.max(32, Math.min(2400, drag.startHeight + vSign * dy)));
        figure.dataset.heightPx = String(nextHeight);
        img.style.height = `${nextHeight}px`;
        img.style.width = '100%';
        img.style.objectFit = 'fill';
      } else {
        if (Math.abs(dy) > Math.abs(dx) && dy !== 0) {
          const targetH = Math.max(32, drag.startHeight + vSign * dy);
          nextWidth = Math.round(Math.max(48, Math.min(drag.maxEditorWidth, targetH * drag.aspectRatio)));
        } else {
          nextWidth = Math.round(Math.max(48, Math.min(drag.maxEditorWidth, drag.startWidth + hSign * dx)));
        }
        nextHeight = Math.round(nextWidth / drag.aspectRatio);
        delete figure.dataset.heightPx;
        img.style.height = 'auto';
        img.style.width = '100%';
        img.style.objectFit = '';
      }

      const nextPct = Math.max(10, Math.min(100, Math.round((nextWidth / drag.maxEditorWidth) * 100)));
      figure.dataset.width = String(nextPct);
      figure.dataset.widthPx = String(nextWidth);
      figure.style.width = `${nextWidth}px`;
      figure.style.maxWidth = '100%';
      setImageWidth(nextPct);
      measureSelectedImage();

      if (commit) {
        updateNote({ content: sanitizeNoteHtml(editor.innerHTML) });
      }
    };

    const onMove = (moveEvent) => applyDrag(moveEvent, false);
    const onUp = (upEvent) => {
      applyDrag(upEvent, true);
      imageResizeDragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
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
      if (changes.width !== undefined) {
        const clamped = Math.max(10, Math.min(100, Number(changes.width) || 100));
        delete figure.dataset.widthPx;
        delete figure.dataset.heightPx;
        figure.dataset.width = String(clamped);
        figure.style.width = `${clamped}%`;
        figure.style.maxWidth = '100%';
        image.style.height = 'auto';
        image.style.objectFit = '';
        setImageWidth(clamped);
      }
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
    window.requestAnimationFrame(() => measureSelectedImage());
  };

  const deleteNote = () => {
    if (!selectedNote) return;
    const targetId = selectedNote.id;
    showConfirm(`Delete “${selectedNote.title || 'Untitled note'}”? This cannot be undone.`, () => {
      clearTimeout(saveTimerRef.current);
      const remaining = notes.filter((note) => note.id !== targetId);
      const next = remaining.length ? remaining : [makeNote()];
      setNotes(next);
      setSelectedId(next[0].id);
      if (remaining.length === 0) {
        persist(next, next[0].id);
      } else {
        saveLocalNotes(currentUser?.uid, next);
        setSaveState('Saved');
      }
      if (currentUser?.uid && db) {
        void deleteNoteInFirestore(db, currentUser.uid, targetId);
      }
      void deleteUnusedNoteImages(next, currentUser?.uid);
    });
  };

  const syncAfterCommand = () => {
    saveEditorSelection();
    refreshToolbarState();
    updateNote({ content: sanitizeNoteHtml(editorRef.current?.innerHTML) });
  };

  const runCommand = (command, value = null) => (event) => {
    event.preventDefault();
    editorRef.current?.focus();
    const restored = saveEditorSelection();
    if (restored) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(restored);
    }
    document.execCommand?.(command, false, value);
    syncAfterCommand();
  };

  const handleToggleInline = (command, tagAliases) => (event) => {
    event.preventDefault();
    editorRef.current?.focus();
    toggleInlineTagInEditor(editorRef.current, command, tagAliases, savedSelectionRef.current);
    syncAfterCommand();
  };

  const handleToggleInlineCode = (event) => {
    event.preventDefault();
    editorRef.current?.focus();
    toggleInlineCodeInEditor(editorRef.current, savedSelectionRef.current);
    syncAfterCommand();
  };

  const applyBlock = (tag, toggleToParagraph = false) => {
    editorRef.current?.focus();
    applyBlockFormatToEditor(editorRef.current, tag, savedSelectionRef.current, { toggleToParagraph });
    syncAfterCommand();
  };

  const changeBlock = (event) => {
    applyBlock(event.target.value, false);
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
              {sourceEditing && <div className="zc-notes-source-edit"><input value={selectedNote.source?.label || ''} onChange={(event) => updateSource({ label: event.target.value })} placeholder="Source label" aria-label="Source label" /><select value={selectedNote.source?.category || 'Workspace'} onChange={(event) => updateSource({ category: event.target.value })} aria-label="Source category"><option value="Lecture">Lecture</option><option value="Learn">Learn</option><option value="Test">Test</option><option value="Cheatsheet">Cheatsheet</option><option value="Workspace">Workspace</option></select></div>}
            </div>
            <div className="zc-notes-toolbar" role="toolbar" aria-label="Formatting controls">
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden aria-label="Upload note images" onChange={(event) => { void insertImages([...event.target.files]); event.target.value = ''; }} />
              <button type="button" className="zc-notes-tool" aria-label="Insert image" title="Insert image (PNG, JPEG, WebP, GIF; up to 10 MB)" disabled={Boolean(imageProgress)} onMouseDown={(event) => { event.preventDefault(); rememberImageRange(); }} onClick={() => { rememberImageRange(); imageInputRef.current.click(); }}><ImagePlus size={16} /></button>
              <div className="zc-notes-tool-group"><ToolbarButton label="Undo" icon={Undo2} onMouseDown={runCommand('undo')} /><ToolbarButton label="Redo" icon={Redo2} onMouseDown={runCommand('redo')} /></div>
              <span className="zc-notes-divider" />
              <div className="zc-notes-tool-group">
                <ToolbarButton label="Heading 1" text="H1" className="zc-notes-tool-heading" active={toolbarState.block === 'h1'} onMouseDown={(event) => { event.preventDefault(); applyBlock('h1', true); }} />
                <ToolbarButton label="Heading 2" text="H2" className="zc-notes-tool-heading" active={toolbarState.block === 'h2'} onMouseDown={(event) => { event.preventDefault(); applyBlock('h2', true); }} />
                <ToolbarButton label="Heading 3" text="H3" className="zc-notes-tool-heading" active={toolbarState.block === 'h3'} onMouseDown={(event) => { event.preventDefault(); applyBlock('h3', true); }} />
              </div>
              <label className="zc-notes-format-select"><select value={toolbarState.block} onChange={changeBlock} aria-label="Text style"><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select><ChevronDown size={13} /></label>
              <span className="zc-notes-divider" />
              <div className="zc-notes-tool-group">
                <ToolbarButton label="Bold" icon={Bold} active={toolbarState.bold} onMouseDown={handleToggleInline('bold', ['STRONG', 'B'])} />
                <ToolbarButton label="Italic" icon={Italic} active={toolbarState.italic} onMouseDown={handleToggleInline('italic', ['EM', 'I'])} />
                <ToolbarButton label="Underline" icon={Underline} active={toolbarState.underline} onMouseDown={handleToggleInline('underline', ['U'])} />
                <ToolbarButton label="Strikethrough" icon={Strikethrough} active={toolbarState.strikeThrough} onMouseDown={handleToggleInline('strikeThrough', ['S', 'STRIKE', 'DEL'])} />
                <ToolbarButton label="Inline code" icon={Code} active={toolbarState.inlineCode} onMouseDown={handleToggleInlineCode} />
              </div>
              <span className="zc-notes-divider" /><ToolbarButton label="More formatting" icon={MoreHorizontal} active={overflowOpen} onMouseDown={(event) => { event.preventDefault(); setOverflowOpen((value) => !value); }} />
              {overflowOpen && <div className="zc-notes-overflow-menu"><ToolbarButton label="Bulleted list" icon={List} active={toolbarState.unorderedList} onMouseDown={runCommand('insertUnorderedList')} /><ToolbarButton label="Numbered list" icon={ListOrdered} active={toolbarState.orderedList} onMouseDown={runCommand('insertOrderedList')} /><ToolbarButton label="Blockquote" icon={Quote} active={toolbarState.blockquote} onMouseDown={(event) => { event.preventDefault(); applyBlock('blockquote', true); }} /><ToolbarButton label="Code block" icon={Code2} active={toolbarState.codeBlock} onMouseDown={(event) => { event.preventDefault(); applyBlock('pre', true); }} /><ToolbarButton label="Horizontal rule" icon={MinusIcon} onMouseDown={runCommand('insertHorizontalRule')} /><ToolbarButton label="Clear formatting" icon={X} onMouseDown={runCommand('removeFormat')} /></div>}
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
            <div ref={editorWrapRef} className="zc-notes-editor-wrap">
              <div ref={editorRef} className="zc-notes-editor" contentEditable suppressContentEditableWarning role="textbox" aria-label="Note content" data-placeholder="Start writing…" onPaste={pasteContent} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={dropImages} onClick={handleEditorClick} onFocus={() => { saveEditorSelection(); refreshToolbarState(); }} onKeyUp={() => { saveEditorSelection(); refreshToolbarState(); }} onMouseUp={() => { saveEditorSelection(); refreshToolbarState(); }} onFocusCapture={selectImage} onLoadCapture={() => { if (selectedImage) measureSelectedImage(); }} onInput={(event) => { saveEditorSelection(); refreshToolbarState(); updateNote({ content: sanitizeNoteHtml(event.currentTarget.innerHTML) }); }} onKeyDown={(event) => { if (event.target.tagName === "IMG" && ["Delete", "Backspace"].includes(event.key)) { event.preventDefault(); editImage({ remove: true }); return; } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); clearTimeout(saveTimerRef.current); persist(notes, selectedNote?.id); } }} />
              {selectedImage && resizerRect && (
                <div
                  className="zc-notes-image-resizer"
                  style={{
                    top: `${resizerRect.top}px`,
                    left: `${resizerRect.left}px`,
                    width: `${Math.max(48, resizerRect.width)}px`,
                    height: `${Math.max(32, resizerRect.height)}px`
                  }}
                  aria-label="Image resize handles"
                >
                  <button type="button" className="zc-notes-resize-handle" data-resize-handle="nw" aria-label="Resize image top-left corner" title="Drag corner to resize (Shift for free aspect)" onPointerDown={(event) => startCornerResize('nw', event)} />
                  <button type="button" className="zc-notes-resize-handle" data-resize-handle="ne" aria-label="Resize image top-right corner" title="Drag corner to resize (Shift for free aspect)" onPointerDown={(event) => startCornerResize('ne', event)} />
                  <button type="button" className="zc-notes-resize-handle" data-resize-handle="sw" aria-label="Resize image bottom-left corner" title="Drag corner to resize (Shift for free aspect)" onPointerDown={(event) => startCornerResize('sw', event)} />
                  <button type="button" className="zc-notes-resize-handle" data-resize-handle="se" aria-label="Resize image bottom-right corner" title="Drag corner to resize (Shift for free aspect)" onPointerDown={(event) => startCornerResize('se', event)} />
                  <span className="zc-notes-resize-badge">{resizerRect.pxWidth > 0 ? `${resizerRect.pxWidth}×${resizerRect.pxHeight}px (${resizerRect.pctWidth}%)` : `${resizerRect.pctWidth}%`}</span>
                </div>
              )}
            </div>
            <footer className="zc-notes-footer"><span className={`zc-notes-save-status ${saveState === 'Saving…' ? 'saving' : ''}`}>{saveState === 'Saved' ? <Check size={13} /> : null}{saveState}</span><span>Rich text is saved locally to this account</span></footer>
          </>}
        </section>
      </main>
    </>
  );
}

function MinusIcon(props) { return <span {...props} style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>−</span>; }

export default Notes;
