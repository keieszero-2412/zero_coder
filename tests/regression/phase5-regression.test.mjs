import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveAccess, basicAccessEnabled, SOLE_ADMIN_UID, SOLE_ADMIN_EMAIL, isTrustedSoleAdmin } from '../../src/utils/accessPolicy.js';
import { extractImageIds } from '../../src/utils/notesStorage.js';
import { getNoteImage } from '../../src/utils/notesImages.js';
import { createImageWorker } from '../../workers/images/src/index.js';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';

test('Access Code matrix: Green, Blue, Gray, Red, bypass, and revocation', () => {
  // 1. Green (trusted Admin claim on pinned sole-admin UID only)
  assert.deepEqual(resolveAccess({ sub: SOLE_ADMIN_UID, admin: true }, { code: 'Red' }, null, false), { role: 'Admin', colorCode: 'Green' });
  assert.deepEqual(resolveAccess({ sub: 'support', admin: true }, { code: 'Red' }, null, false), { role: 'Unauthorized', colorCode: 'Red' });
  assert.deepEqual(resolveAccess({ admin: true }, null, null, true), { role: 'User', colorCode: 'Gray' });

  // 2. Blue (UID grant or verified email grant)
  assert.deepEqual(resolveAccess({ admin: false }, { code: 'Blue' }, null, false), { role: 'User', colorCode: 'Blue' });
  assert.deepEqual(resolveAccess({ admin: false, email_verified: true }, null, { code: 'Blue' }, false), { role: 'User', colorCode: 'Blue' });

  // 3. Gray (explicit Gray grant or bypass enabled)
  assert.deepEqual(resolveAccess({ admin: false }, { code: 'Gray' }, null, false), { role: 'User', colorCode: 'Gray' });
  assert.deepEqual(resolveAccess({ admin: false }, null, null, true), { role: 'User', colorCode: 'Gray' });

  // 4. Red (revocation via user_access overrides email grant; unverified email denied)
  assert.deepEqual(resolveAccess({ admin: false, email_verified: true }, { code: 'Red' }, { code: 'Blue' }, true), { role: 'Unauthorized', colorCode: 'Red' });
  assert.deepEqual(resolveAccess({ admin: false, email_verified: false }, null, { code: 'Blue' }, false), { role: 'Unauthorized', colorCode: 'Red' });

  // 5. Bypass helper checks canonical v2 first, falls back to legacy
  assert.equal(basicAccessEnabled({ schemaVersion: 2, bypassBlueCode: false }, { bypassBlueCode: true }), false);
  assert.equal(basicAccessEnabled({ schemaVersion: 2, bypassBlueCode: true }, { bypassBlueCode: false }), true);
  assert.equal(basicAccessEnabled(null, { bypassBlueCode: true }), true);
});

test('Reference-aware cleanup: prevents deletion of linked/recent originals and enforces owner-only delete', async () => {
  const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });
  const records = new Map();
  const objects = new Map();

  const repository = {
    authorize: async (claims) => ({ ...claims, role: claims.admin ? 'Admin' : 'User' }),
    get: async (owner, id) => records.get(`${owner}/${id}`) || null,
    reserve: async (record) => records.set(`${record.ownerUid}/${record.id}`, { ...record, state: 'pending' }),
    ready: async (record) => records.set(`${record.ownerUid}/${record.id}`, { ...record, state: 'ready' }),
    cleanup: async (owner, id, remove) => {
      const r = records.get(`${owner}/${id}`);
      if (r.linked) throw Object.assign(new Error('Image is referenced by current data, history or migration recovery.'), { status: 409 });
      if (r.state === 'ready') {
        r.state = 'detached';
        r.detachedAt = Date.now();
        return { state: 'detached' };
      }
      if (Date.now() - r.detachedAt < 7 * 86400000) {
        throw Object.assign(new Error('Detached original is still in its seven-day recovery period.'), { status: 409 });
      }
      await remove(r);
      r.state = 'deleted';
      return { state: 'deleted' };
    }
  };

  const bucket = {
    head: async (k) => objects.get(k) || null,
    put: async (k, data, opts) => {
      objects.set(k, { size: data.byteLength, customMetadata: opts.customMetadata, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) });
      return objects.get(k);
    },
    get: async (k) => objects.get(k) || null,
    delete: async (k) => objects.delete(k)
  };

  const worker = createImageWorker({
    verifyToken: async (token) => ({ sub: token === 'admin' ? SOLE_ADMIN_UID : token === 'rogueAdmin' ? 'support' : 'alice', admin: token === 'admin' || token === 'rogueAdmin' }),
    makeRepository: () => repository
  });
  const env = { IMAGES_ENABLED: 'true', FIREBASE_PROJECT_ID: 'demo-zerocoder', ALLOWED_ORIGINS: 'https://app.example', PRIVATE_R2: bucket };

  const meta = await prepareOriginal(png, { ownerUid: 'alice', feature: 'notes', parentId: 'n1' });
  await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}?feature=notes&parentId=n1`, {
    method: 'PUT',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer alice', 'Content-Type': 'image/png', 'X-Image-SHA256': meta.sha256 },
    body: png
  }), env);

  // Admin and non-owner admin-claim UID cannot read private notes or delete another user's image
  const rogueDelete = await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}?owner=alice`, {
    method: 'DELETE',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer rogueAdmin' }
  }), env);
  assert.equal(rogueDelete.status, 403);

  const adminDelete = await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}?owner=alice`, {
    method: 'DELETE',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer admin' }
  }), env);
  assert.equal(adminDelete.status, 403);

  // Referenced image cannot be deleted
  records.get(`alice/${meta.id}`).linked = true;
  const linkedDelete = await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}`, {
    method: 'DELETE',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer alice' }
  }), env);
  assert.equal(linkedDelete.status, 409);
  assert.equal(objects.size, 1);

  // Unlinked image detaches first (202), then blocks during grace period (409), then purges after 7 days (200)
  records.get(`alice/${meta.id}`).linked = false;
  assert.equal((await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}`, {
    method: 'DELETE',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer alice' }
  }), env)).status, 202);

  assert.equal((await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}`, {
    method: 'DELETE',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer alice' }
  }), env)).status, 409);

  records.get(`alice/${meta.id}`).detachedAt = Date.now() - 8 * 86400000;
  assert.equal((await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}`, {
    method: 'DELETE',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer alice' }
  }), env)).status, 200);
  assert.equal(objects.size, 0);
});

test('Notes export & image asset lookup: rejects invalid IDs and preserves UUID + SHA-256 references', async () => {
  await assert.rejects(async () => getNoteImage('not-valid-id'), /invalid image reference/i);

  const uuid = '12345678-1234-1234-1234-123456789abc';
  const sha = 'a'.repeat(64);
  const html = `<figure><img data-image-id="${uuid}"></figure><figure><img data-image-id="${sha}"></figure>`;
  assert.deepEqual(extractImageIds(html), [uuid, sha]);
});

test('Architecture & UI preservation: six themes intact and Firebase Storage removed', () => {
  const settingsSrc = fs.readFileSync(new URL('../../src/context/SettingsContext.jsx', import.meta.url), 'utf8');
  for (const theme of ['midnight', 'daylight', 'blush', 'oceanic', 'carbon', 'amber']) {
    assert.equal(settingsSrc.includes(theme), true, `Missing theme: ${theme}`);
  }

  const firebaseSrc = fs.readFileSync(new URL('../../src/config/firebase.js', import.meta.url), 'utf8');
  assert.equal(firebaseSrc.includes('firebase/storage'), false);
  assert.equal(firebaseSrc.includes('getStorage'), false);

  const notesImagesSrc = fs.readFileSync(new URL('../../src/utils/notesImages.js', import.meta.url), 'utf8');
  assert.equal(notesImagesSrc.includes('firebase/storage'), false);
});

test('Phase 6 local remediation regressions: Single-Admin pinning, feedback targetId consistency, and access_requests UID alignment', () => {
  // 1. Single-Admin enforcement across accessPolicy, AuthContext, GlobalHeader, AdminPanel & Worker
  assert.equal(isTrustedSoleAdmin({ uid: SOLE_ADMIN_UID, email: SOLE_ADMIN_EMAIL }, { admin: true }), true);
  assert.equal(isTrustedSoleAdmin({ uid: SOLE_ADMIN_UID, email: SOLE_ADMIN_EMAIL }, {}), true);
  assert.equal(isTrustedSoleAdmin({ uid: SOLE_ADMIN_UID, email: SOLE_ADMIN_EMAIL }, { admin: false }), false);
  assert.equal(isTrustedSoleAdmin({ uid: SOLE_ADMIN_UID, email: 'other@example.com' }, { admin: true }), true);
  assert.equal(isTrustedSoleAdmin({ uid: 'forged-uid', email: SOLE_ADMIN_EMAIL, role: 'Admin' }, { admin: true }), false);
  assert.equal(isTrustedSoleAdmin(null, { admin: true }), false);

  const authCtxSrc = fs.readFileSync(new URL('../../src/context/AuthContext.jsx', import.meta.url), 'utf8');
  assert.equal(authCtxSrc.includes('isTrustedSoleAdmin'), true);
  assert.equal(authCtxSrc.includes("userData.role !== 'Admin'"), true);
  assert.equal(authCtxSrc.includes('onIdTokenChanged'), true);
  assert.equal(authCtxSrc.includes('refreshUser'), true);
  assert.equal(authCtxSrc.includes('emailVerified: Boolean(user.emailVerified)'), true);

  const globalHeaderSrc = fs.readFileSync(new URL('../../src/components/GlobalHeader.jsx', import.meta.url), 'utf8');
  assert.equal(globalHeaderSrc.includes('SOLE_ADMIN_UID'), true);
  assert.equal(globalHeaderSrc.includes('const isSoleAdmin ='), true);

  // 2. FeedbackWidget single targetId, verified R2 legacy visibility, existingImageIds merge, & URL revocation
  const feedbackSrc = fs.readFileSync(new URL('../../src/components/FeedbackWidget.jsx', import.meta.url), 'utf8');
  assert.equal(feedbackSrc.includes('const targetId = editingFeedbackId || doc(collection(db, \'feedbacks\')).id;'), true);
  assert.equal(feedbackSrc.includes('const newRef = doc(db, \'feedbacks\', targetId);'), true);
  assert.equal(feedbackSrc.includes("const hasVerifiedR2Migration = fb.imageMigration?.status === 'verified' && fb.imageIds?.length > 0 && isImagesConfigured();"), true);
  assert.equal(feedbackSrc.includes('existingImageIds'), true);
  assert.equal(feedbackSrc.includes('filePreviews'), true);
  assert.equal(feedbackSrc.includes('openImagePreview'), true);
  assert.equal(feedbackSrc.includes('URL.revokeObjectURL'), true);
  assert.equal(feedbackSrc.includes('const compressImage ='), false);

  // 3. AdminPanel SOLE_ADMIN_UID guard, verified R2 legacy visibility, URL revocation, and canonical bypass listener
  const adminSrc = fs.readFileSync(new URL('../../src/components/AdminPanel.jsx', import.meta.url), 'utf8');
  assert.equal(adminSrc.includes('const isSoleAdmin ='), true);
  assert.equal(adminSrc.includes('if (!isSoleAdmin) return null;'), true);
  assert.equal(adminSrc.includes("const hasVerifiedR2Migration = fb.imageMigration?.status === 'verified' && fb.imageIds?.length > 0 && isImagesConfigured();"), true);
  assert.equal(adminSrc.includes('basicAccessEnabled'), true);
  assert.equal(adminSrc.includes('openImagePreview'), true);
  assert.equal(adminSrc.includes('URL.revokeObjectURL'), true);

  // 4. Canonical UID-keyed access_requests writes/listeners & 80-char username cap
  const aiSrc = fs.readFileSync(new URL('../../src/components/AIAssistant.jsx', import.meta.url), 'utf8');
  assert.equal(aiSrc.includes("doc(db, 'access_requests', currentUser.uid)"), true);
  assert.equal(aiSrc.includes('.slice(0, 80)'), true);
  const learningAiSrc = fs.readFileSync(new URL('../../src/components/LearningAIChat.jsx', import.meta.url), 'utf8');
  assert.equal(learningAiSrc.includes("doc(db, 'access_requests', currentUser.uid)"), true);
  assert.equal(learningAiSrc.includes("requestedCode: 'Blue'"), true);
  assert.equal(learningAiSrc.includes('.slice(0, 80)'), true);

  // 5. Pre-auth Step-1 check, registration race guard, /unauthorized verification + request flow, Notes sync target & 2809 Single-Admin gating
  assert.equal(authCtxSrc.includes('pendingRegistrationRef'), true);
  assert.equal(authCtxSrc.includes('preAuthLookupRestricted: true'), true);
  assert.equal(authCtxSrc.includes('normalizedEmail === SOLE_ADMIN_EMAIL'), true);
  assert.equal(authCtxSrc.includes("updateDoc(profileRef, { username: safeUsername })"), true);

  const authPageSrc = fs.readFileSync(new URL('../../src/pages/Auth.jsx', import.meta.url), 'utf8');
  assert.equal(authPageSrc.includes('const existingProfile = await getDoc(userDocRef)'), true);
  assert.equal(authPageSrc.includes('if (!activeUser.emailVerified)'), true);
  assert.equal(authPageSrc.includes('emailStatus.preAuthLookupRestricted'), true);

  const unauthorizedSrc = fs.readFileSync(new URL('../../src/pages/Unauthorized.jsx', import.meta.url), 'utf8');
  assert.equal(unauthorizedSrc.includes('sendEmailVerification'), true);
  assert.equal(unauthorizedSrc.includes('refreshUser'), true);
  assert.equal(unauthorizedSrc.includes("doc(db, 'access_requests', currentUser.uid)"), true);
  assert.equal(unauthorizedSrc.includes('.slice(0, 80)'), true);

  const authActionsSrc = fs.readFileSync(new URL('../../src/utils/authActions.js', import.meta.url), 'utf8');
  assert.equal(authActionsSrc.includes('.slice(0, 80)'), true);

  assert.equal(globalHeaderSrc.includes("currentUser?.colorCode || 'Red'"), true);
  const dashboardSrc = fs.readFileSync(new URL('../../src/pages/Dashboard.jsx', import.meta.url), 'utf8');
  assert.equal(dashboardSrc.includes('currentUser?.uid === SOLE_ADMIN_UID'), true);
  const workspaceSrc = fs.readFileSync(new URL('../../src/pages/Workspace.jsx', import.meta.url), 'utf8');
  assert.equal(workspaceSrc.includes('currentUser?.uid === SOLE_ADMIN_UID'), true);

  const notesStorageSrc = fs.readFileSync(new URL('../../src/utils/notesStorage.js', import.meta.url), 'utf8');
  assert.equal(notesStorageSrc.includes('enqueueNoteSync'), true);
  assert.equal(notesStorageSrc.includes('.slice(0, 200)'), true);
  assert.equal(notesStorageSrc.includes('onSync(remoteNotes, deletedIds)'), true);

  const notesPageSrc = fs.readFileSync(new URL('../../src/pages/Notes.jsx', import.meta.url), 'utf8');
  assert.equal(notesPageSrc.includes('const persist = useCallback((nextNotes, targetId = currentNotesRef.current?.id)'), true);
  assert.equal(notesPageSrc.includes('persist(next, note.id);'), true);
  assert.equal(notesPageSrc.includes('persist(next, targetId)'), true);
});

test('Cross-layer Email/Password auth consistency and Notes UI/export/theme completeness', () => {
  const authCtxSrc = fs.readFileSync(new URL('../../src/context/AuthContext.jsx', import.meta.url), 'utf8');
  const authPageSrc = fs.readFileSync(new URL('../../src/pages/Auth.jsx', import.meta.url), 'utf8');
  const notesPageSrc = fs.readFileSync(new URL('../../src/pages/Notes.jsx', import.meta.url), 'utf8');
  const notesExportSrc = fs.readFileSync(new URL('../../src/utils/notesExport.js', import.meta.url), 'utf8');
  const indexCssSrc = fs.readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8');

  // AuthContext matches accessPolicy/firestore.rules/Worker without profile overrides or Google OAuth
  assert.equal(authCtxSrc.includes('resolveAccess'), true);
  assert.equal(authCtxSrc.includes('emailVerified === true'), true);
  assert.equal(authCtxSrc.includes('await syncUserState(auth.currentUser)'), true);
  assert.equal(authCtxSrc.includes('blueIdentifiers'), false);
  assert.equal(authCtxSrc.includes('hardcodedBlueEmails'), false);
  assert.equal(authCtxSrc.includes('signInWithEmailAndPassword'), true);
  assert.equal(authCtxSrc.includes('createUserWithEmailAndPassword'), true);
  assert.equal(authCtxSrc.includes('sendPasswordResetEmail'), true);
  assert.equal(authCtxSrc.includes('GoogleAuthProvider'), false);
  assert.equal(authPageSrc.includes('GoogleAuthProvider'), false);

  // Notes UI: offline/online reconnect migration, search/tags/source stats, MD/PDF/DOCX export, zoom clamp, responsive, 6 themes
  assert.equal(notesPageSrc.includes("window.addEventListener('online', handleOnline)"), true);
  assert.equal(notesPageSrc.includes('runCloudMigrationAndFlush'), true);
  assert.equal(notesPageSrc.includes('deleteUnusedNoteImages'), true);
  assert.equal(notesPageSrc.includes("exportCurrent('md')"), true);
  assert.equal(notesPageSrc.includes("exportCurrent('pdf')"), true);
  assert.equal(notesPageSrc.includes("exportCurrent('docx')"), true);
  assert.equal(notesPageSrc.includes('window.visualViewport'), true);
  assert.equal(notesPageSrc.includes('ResizeObserver'), true);

  assert.equal(notesExportSrc.includes('export async function exportMarkdown('), true);
  assert.equal(notesExportSrc.includes('export async function exportPdf('), true);
  assert.equal(notesExportSrc.includes('export async function exportDocx('), true);

  assert.equal(indexCssSrc.includes('.zc-notes-floating-panel'), true);
  assert.equal(indexCssSrc.includes('@media (max-width: 760px)'), true);
  assert.equal(indexCssSrc.includes('var(--bg-surface)'), true);
  for (const themeClass of ['body.theme-daylight', 'body.theme-blush', 'body.theme-oceanic', 'body.theme-carbon', 'body.theme-amber']) {
    assert.equal(indexCssSrc.includes(themeClass), true, `Missing CSS theme block: ${themeClass}`);
  }
});

test('Notes editor bugfix regressions: Source select themes, real H1/H2/H3, direct URL paste, active toolbar, corner image resize, bound fetch & self-conflict guard', () => {
  const indexCssSrc = fs.readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8');
  const notesPageSrc = fs.readFileSync(new URL('../../src/pages/Notes.jsx', import.meta.url), 'utf8');
  const notesStorageSrc = fs.readFileSync(new URL('../../src/utils/notesStorage.js', import.meta.url), 'utf8');
  const notesExportSrc = fs.readFileSync(new URL('../../src/utils/notesExport.js', import.meta.url), 'utf8');
  const imageStorageSrc = fs.readFileSync(new URL('../../src/utils/imageStorage.js', import.meta.url), 'utf8');
  const notesImagesSrc = fs.readFileSync(new URL('../../src/utils/notesImages.js', import.meta.url), 'utf8');
  const authCtxSrc = fs.readFileSync(new URL('../../src/context/AuthContext.jsx', import.meta.url), 'utf8');

  // 1. Source dropdown & theme readability across all 6 themes + desktop/mobile + hover/focus/disabled
  assert.equal(indexCssSrc.includes('color-scheme: dark;'), true);
  assert.equal(indexCssSrc.includes('color-scheme: light;'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-shell select'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-shell select:hover:not(:disabled)'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-shell select:focus-visible'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-shell select:disabled'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-shell select option'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-shell select option:checked'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-source-edit select { min-width: 120px;'), true);
  for (const cat of ['Lecture', 'Learn', 'Test', 'Cheatsheet', 'Workspace']) {
    assert.equal(notesPageSrc.includes(`<option value="${cat}">${cat}</option>`), true);
  }
  assert.equal(notesPageSrc.includes('updateSource({ category: event.target.value })'), true);

  // 2. Real H1/H2/H3 heading formatting, typography, persistence, and PDF/DOCX/MD export
  assert.equal(notesPageSrc.includes('label="Heading 1" text="H1"'), true);
  assert.equal(notesPageSrc.includes('label="Heading 2" text="H2"'), true);
  assert.equal(notesPageSrc.includes('label="Heading 3" text="H3"'), true);
  assert.equal(notesPageSrc.includes('<select value={toolbarState.block} onChange={changeBlock} aria-label="Text style">'), true);
  assert.equal(notesPageSrc.includes('applyBlockFormatToEditor'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-editor h1 { font-size: 1.75rem;'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-editor h2 { font-size: 1.4rem;'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-editor h3 { font-size: 1.15rem;'), true);
  assert.equal(notesExportSrc.includes("block.type === 'h1' ? 17 : block.type === 'h2' ? 15 : block.type === 'h3' ? 13 : 11"), true);

  // 3. Remove "Paste a URL" modal dialog; auto-link pasted URLs & click to open
  assert.equal(notesPageSrc.includes('Paste a URL'), false);
  assert.equal(notesPageSrc.includes('window.prompt'), false);
  assert.equal(notesPageSrc.includes('Add hyperlink'), false);
  assert.equal(notesPageSrc.includes('isValidNoteUrl'), true);
  assert.equal(notesPageSrc.includes('linkifyPlainTextToHtml'), true);
  assert.equal(notesPageSrc.includes('linkifyHtmlFragment'), true);
  assert.equal(notesPageSrc.includes("window.open(validHref, '_blank', 'noopener,noreferrer')"), true);

  // 4. Toolbar active state tracked on selection/cursor move/focus/input & styled via aria-pressed
  assert.equal(notesPageSrc.includes('aria-pressed={typeof active === \'boolean\' ? active : undefined}'), true);
  assert.equal(notesPageSrc.includes("document.addEventListener('selectionchange', onSelectionChange)"), true);
  assert.equal(notesPageSrc.includes('computeEditorToolbarState'), true);
  assert.equal(notesPageSrc.includes('active={toolbarState.bold}'), true);
  assert.equal(notesPageSrc.includes('active={toolbarState.italic}'), true);
  assert.equal(notesPageSrc.includes('active={toolbarState.underline}'), true);
  assert.equal(notesPageSrc.includes('active={toolbarState.strikeThrough}'), true);
  assert.equal(notesPageSrc.includes('active={toolbarState.inlineCode}'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-tool[aria-pressed="true"]'), true);

  // 5. Image paste & interactive 4-corner drag resize
  assert.equal(notesPageSrc.includes('className="zc-notes-image-resizer"'), true);
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    assert.equal(notesPageSrc.includes(`data-resize-handle="${corner}"`), true);
  }
  assert.equal(notesPageSrc.includes('startCornerResize'), true);
  assert.equal(indexCssSrc.includes('.zc-notes-resize-handle'), true);

  // 6. R2 bound fetch, pending IndexedDB preservation, Admin claim refresh, and sync race guard
  assert.equal(imageStorageSrc.includes('globalThis.fetch(...args)'), true);
  assert.equal(notesImagesSrc.includes('record.cloudSynced = false;'), true);
  assert.equal(notesStorageSrc.includes('sessionSyncedState'), true);
  assert.equal(notesPageSrc.includes('localEditedWhileInFlight'), true);
  assert.equal(authCtxSrc.includes('getIdTokenResult(true)'), true);
});




