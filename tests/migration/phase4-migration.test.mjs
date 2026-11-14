import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImageDataUrl } from '../../src/utils/migration/dataUrl.js';
import { createMigrationEngine } from '../../src/utils/migration/legacyMigration.js';
import { evaluateFeedbackRollback, evaluateNoteWrite } from '../../src/utils/migration/firestoreAdapter.js';
import { createImageStorage } from '../../src/utils/imageStorage.js';
import { sha256 } from '../../src/utils/imageOriginal.js';

const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
const PNG_B64 = btoa(String.fromCharCode(...PNG_BYTES));
const PNG_DATA_URL = `data:image/png;base64,${PNG_B64}`;

const JPG_BYTES = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]);
const JPG_B64 = btoa(String.fromCharCode(...JPG_BYTES));
const JPG_DATA_URL = `data:image/jpeg;base64,${JPG_B64}`;

function createFixture({ uid = 'alice', failOnCall = -1 } = {}) {
  let currentUid = uid;
  const auth = {
    get currentUser() {
      return currentUid ? { uid: currentUid, getIdToken: async () => `tok-${currentUid}` } : null;
    }
  };

  const r2Objects = new Map();
  let uploadCalls = 0;

  const imageStorage = createImageStorage({
    auth,
    baseUrl: 'https://images.example.com',
    enabled: true,
    fetcher: async (url, options) => {
      if (options.method === 'PUT') {
        uploadCalls++;
        if (uploadCalls === failOnCall) {
          return Response.json({ error: 'Simulated network interruption' }, { status: 500 });
        }
        const parsed = new URL(url);
        const id = parsed.pathname.split('/').pop();
        const feature = parsed.searchParams.get('feature');
        const parentId = parsed.searchParams.get('parentId');
        const bytes = new Uint8Array(await options.body.arrayBuffer());
        const hash = await sha256(bytes);
        const ext = options.headers['Content-Type'] === 'image/jpeg' ? 'jpg' : 'png';
        const record = {
          id,
          ownerUid: currentUid,
          feature,
          parentId,
          sha256: hash,
          size: bytes.byteLength,
          contentType: options.headers['Content-Type'],
          extension: ext,
          objectKey: `images/v1/${currentUid}/${feature}/${id}.${ext}`,
          state: 'ready'
        };
        r2Objects.set(id, { record, bytes });
        return Response.json(record, { status: 201 });
      }
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
  });

  const feedbacksDb = new Map();
  const notesDb = new Map();

  const firestore = {
    async getFeedback(id) {
      return feedbacksDb.get(id) || null;
    },
    async updateFeedback(id, patch) {
      const prev = feedbacksDb.get(id) || { id };
      feedbacksDb.set(id, { ...prev, ...patch });
    },
    async rollbackFeedbackIfUnchanged(id, backupCreatedAt, patch) {
      const current = feedbacksDb.get(id);
      if (!current) return { status: 'missing' };
      const decision = evaluateFeedbackRollback(current, backupCreatedAt);
      if (decision.status !== 'ok') return decision;
      feedbacksDb.set(id, { ...current, ...patch });
      return { status: 'restored' };
    },
    async getNote(ownerUid, noteId) {
      return notesDb.get(`${ownerUid}/${noteId}`) || null;
    },
    async saveNote(ownerUid, noteId, data) {
      notesDb.set(`${ownerUid}/${noteId}`, { ...data });
    },
    async saveNoteIfUnchanged(ownerUid, noteId, localNote, buildPayload, expectedImageIds = null) {
      const key = `${ownerUid}/${noteId}`;
      const remote = notesDb.get(key) || null;
      const decision = evaluateNoteWrite(remote, localNote, expectedImageIds);
      if (decision.status !== 'write') return decision;
      const payload = buildPayload(decision.nextRevision);
      notesDb.set(key, { ...payload });
      return { status: 'migrated', revision: decision.nextRevision };
    }
  };

  const localMap = new Map();
  const localStore = {
    getItem: (k) => localMap.get(k) ?? null,
    setItem: (k, v) => localMap.set(k, v),
    removeItem: (k) => localMap.delete(k)
  };

  const cacheMap = new Map();
  const imageCache = {
    async get(u, type, id) {
      return cacheMap.get(`${u}/${id}`) || null;
    },
    async put(u, type, id, rec) {
      cacheMap.set(`${u}/${id}`, rec);
    }
  };

  const engine = createMigrationEngine({
    auth,
    imageStorage,
    firestore,
    localStore,
    imageCache,
    now: () => 1700000000000
  });

  return {
    engine,
    auth,
    firestore,
    setUid: (next) => { currentUid = next; },
    r2Objects,
    feedbacksDb,
    notesDb,
    localStore,
    cacheMap,
    getUploadCalls: () => uploadCalls
  };
}

test('parseImageDataUrl validates magic bytes and rejects spoofed or malformed URLs', () => {
  const png = parseImageDataUrl(PNG_DATA_URL);
  assert.equal(png.mimeType, 'image/png');
  assert.equal(png.size, PNG_BYTES.length);

  const jpg = parseImageDataUrl(JPG_DATA_URL);
  assert.equal(jpg.mimeType, 'image/jpeg');
  assert.equal(jpg.ext, 'jpg');

  // Spoofed MIME: PNG bytes with JPEG header
  assert.throws(() => parseImageDataUrl(`data:image/jpeg;base64,${PNG_B64}`), /magic bytes/i);
  // Malformed
  assert.throws(() => parseImageDataUrl('https://example.com/a.png'), /malformed/i);
});

test('Dry-run produces verified manifest with zero cloud or local mutations', async () => {
  const f = createFixture();
  const fb = { id: 'fb-1', userId: 'alice', imageUrls: [PNG_DATA_URL], imageIds: [] };
  f.feedbacksDb.set('fb-1', fb);

  const report = await f.engine.migrateFeedbacks('alice', [fb], { dryRun: true });
  assert.equal(report.dryRun, true);
  assert.equal(report.migrated, 1);
  assert.equal(report.verifiedObjects.length, 1);
  assert.equal(report.verifiedObjects[0].status, 'planned');
  assert.equal(report.verifiedObjects[0].size, PNG_BYTES.length);
  assert.equal(f.r2Objects.size, 0);
  assert.equal(f.getUploadCalls(), 0);
  assert.deepEqual(f.feedbacksDb.get('fb-1').imageIds, []);
});

test('Feedback migration uploads to R2, preserves legacy Base64, and is idempotent on repeat runs', async () => {
  const f = createFixture();
  const fb = { id: 'fb-1', userId: 'alice', imageUrls: [PNG_DATA_URL, JPG_DATA_URL], imageIds: [] };
  f.feedbacksDb.set('fb-1', fb);

  const run1 = await f.engine.migrateFeedbacks('alice', [fb], { runId: 'run-1' });
  assert.equal(run1.migrated, 1);
  assert.equal(run1.failed, 0);
  assert.equal(run1.verifiedObjects.length, 2);
  assert.equal(f.r2Objects.size, 2);

  const updated = f.feedbacksDb.get('fb-1');
  assert.equal(updated.imageIds.length, 2);
  // Legacy Base64 data is preserved untouched
  assert.deepEqual(updated.imageUrls, [PNG_DATA_URL, JPG_DATA_URL]);
  assert.equal(updated.imageMigration.status, 'verified');
  assert.equal(updated.imageMigration.sourceCount, 2);
  assert.equal(updated.imageMigration.verifiedCount, 2);

  // Second run must skip already verified feedback and perform 0 uploads
  const callsBefore = f.getUploadCalls();
  const run2 = await f.engine.migrateFeedbacks('alice', [updated], { runId: 'run-2' });
  assert.equal(run2.skippedAlreadyVerified, 1);
  assert.equal(run2.migrated, 0);
  assert.equal(f.getUploadCalls(), callsBefore);
});

test('Interrupted upload preserves partial progress and resumes cleanly on retry', async () => {
  // Fail on 2nd upload
  const f = createFixture({ failOnCall: 2 });
  const fb = { id: 'fb-2', userId: 'alice', imageUrls: [PNG_DATA_URL, JPG_DATA_URL], imageIds: [] };
  f.feedbacksDb.set('fb-2', fb);

  const partialRun = await f.engine.migrateFeedbacks('alice', [fb], { runId: 'run-partial' });
  assert.equal(partialRun.failed, 1);
  assert.equal(partialRun.pending.length, 1);
  assert.equal(partialRun.pending[0].index, 1);

  const partialDoc = f.feedbacksDb.get('fb-2');
  assert.equal(partialDoc.imageIds.length, 1);
  assert.equal(partialDoc.imageMigration.status, 'partial');
  assert.deepEqual(partialDoc.imageUrls, [PNG_DATA_URL, JPG_DATA_URL]);

  // Retry without failure (failOnCall: -1)
  // Re-use same feedbacksDb & r2Objects via new engine without failOnCall
  const f2 = createFixture();
  f2.feedbacksDb.set('fb-2', partialDoc);
  const resumeRun = await f2.engine.migrateFeedbacks('alice', [partialDoc], { runId: 'run-resume' });
  assert.equal(resumeRun.failed, 0);
  assert.equal(resumeRun.migrated, 1);

  const finalDoc = f2.feedbacksDb.get('fb-2');
  assert.equal(finalDoc.imageIds.length, 2);
  assert.equal(finalDoc.imageMigration.status, 'verified');
});

test('Account switching aborts migration immediately without cross-account leakage', async () => {
  const f = createFixture({ uid: 'alice' });
  const fb = { id: 'fb-1', userId: 'alice', imageUrls: [PNG_DATA_URL], imageIds: [] };
  f.setUid('bob');

  await assert.rejects(
    async () => f.engine.migrateFeedbacks('alice', [fb]),
    /account changed/i
  );
  assert.equal(f.r2Objects.size, 0);
});

test('Notes migration isolates accounts, respects concurrent remote edits, and preserves localStorage', async () => {
  const f = createFixture({ uid: 'alice' });
  const imgUuid = '12345678-1234-1234-1234-123456789abc';
  const pngBlob = new Blob([PNG_BYTES], { type: 'image/png' });
  f.cacheMap.set(`alice/${imgUuid}`, { id: imgUuid, blob: pngBlob });

  const aliceNotes = [
    {
      id: 'note-local',
      title: 'Alice Study Note',
      content: `<p>Diagram:</p><figure><img data-image-id="${imgUuid}" alt="Diagram"></figure>`,
      tags: ['sql', 'midterm'],
      source: { category: 'Learn', course: 'database' },
      createdAt: 1000,
      updatedAt: 2000
    },
    {
      id: 'note-conflict',
      title: 'Older Local Note',
      content: '<p>Old local text</p>',
      tags: [],
      createdAt: 1000,
      updatedAt: 2000
    }
  ];
  f.localStore.setItem('zerocoder_notes_alice', JSON.stringify(aliceNotes));
  f.localStore.setItem('zerocoder_notes_guest', JSON.stringify([{ id: 'guest-1', title: 'Guest Note', content: '<p>Guest</p>', updatedAt: 1500 }]));
  f.localStore.setItem('zerocoder_notes_bob', JSON.stringify([{ id: 'bob-1', title: 'Bob Secret', content: '<p>Secret</p>', updatedAt: 1500 }]));

  // Pre-seed remote newer edit for note-conflict
  await f.firestore.saveNote('alice', 'note-conflict', {
    id: 'note-conflict',
    ownerUid: 'alice',
    title: 'Newer Remote Edit',
    content: '<p>Newer cloud text</p>',
    updatedAt: 5000,
    revision: 3
  });

  const report = await f.engine.migrateNotes('alice', { adoptGuest: false, runId: 'notes-run-1' });
  assert.equal(report.totalNotes, 2); // Only Alice's 2 notes; never Bob's or Guest's
  assert.equal(report.migratedNotes, 1);
  assert.equal(report.skippedConflicts, 1);
  assert.equal(report.migratedImages, 1);
  assert.equal(f.r2Objects.size, 1);

  // Verify remote note-conflict was NOT overwritten
  const conflictRemote = await f.firestore.getNote('alice', 'note-conflict');
  assert.equal(conflictRemote.title, 'Newer Remote Edit');
  assert.equal(conflictRemote.revision, 3);

  // Verify note-local retained tags, source, imageIds, and rewritten canonical SHA-256 content
  const localRemote = await f.firestore.getNote('alice', 'note-local');
  assert.equal(localRemote.title, 'Alice Study Note');
  assert.deepEqual(localRemote.tags, ['sql', 'midterm']);
  assert.deepEqual(localRemote.source, { category: 'Learn', course: 'database' });
  assert.equal(localRemote.imageIds.length, 1);
  assert.match(localRemote.imageIds[0], /^[a-f0-9]{64}$/);
  assert.equal(localRemote.content.includes(`data-image-id="${localRemote.imageIds[0]}"`), true);
  assert.equal(localRemote.content.includes(imgUuid), false);

  // Repeat migration run must recognize note-local as up-to-date without re-uploading
  const callsBefore = f.getUploadCalls();
  const repeatReport = await f.engine.migrateNotes('alice', { adoptGuest: false, runId: 'notes-run-2' });
  assert.equal(repeatReport.skippedConflicts, 1);

  // Verify localStorage was NOT deleted
  assert.ok(f.localStore.getItem('zerocoder_notes_alice'));
  assert.ok(f.cacheMap.get(`alice/${imgUuid}`));
  assert.ok(f.cacheMap.get(`alice/${localRemote.imageIds[0]}`));
  assert.ok(callsBefore >= 1);
});

test('Image-only rollback restores pre-migration state without overwriting later user edits', async () => {
  const f = createFixture({ uid: 'alice' });
  const fb1 = { id: 'fb-1', userId: 'alice', imageUrls: [PNG_DATA_URL], imageIds: [], updatedAt: 1000 };
  const fb2 = { id: 'fb-2', userId: 'alice', imageUrls: [JPG_DATA_URL], imageIds: [], updatedAt: 1000 };
  f.feedbacksDb.set('fb-1', fb1);
  f.feedbacksDb.set('fb-2', fb2);

  const backup = f.engine.createBackupSnapshot('alice', [fb1, fb2], []);
  await f.engine.migrateFeedbacks('alice', [fb1, fb2], { runId: backup.runId });

  // Simulate user editing fb-2 AFTER migration
  await f.firestore.updateFeedback('fb-2', {
    description: 'User updated description later',
    updatedAt: backup.createdAt + 50000,
    imageMigration: { runId: 'later-edit' }
  });

  const rollback = await f.engine.rollbackFeedbackImages('alice', backup);
  assert.equal(rollback.restored, 1);
  assert.equal(rollback.skippedNewerEdits, 1);

  const restoredFb1 = await f.firestore.getFeedback('fb-1');
  assert.deepEqual(restoredFb1.imageIds, []);
  assert.equal(restoredFb1.imageMigration, null);
  assert.deepEqual(restoredFb1.imageUrls, [PNG_DATA_URL]);

  const preservedFb2 = await f.firestore.getFeedback('fb-2');
  assert.equal(preservedFb2.description, 'User updated description later');
});

test('Backup snapshots persist durably across simulated page reload and support runId rollback', async () => {
  const f = createFixture({ uid: 'alice' });
  const fb = { id: 'fb-durable', userId: 'alice', imageUrls: [PNG_DATA_URL], imageIds: [], updatedAt: 1000 };
  f.feedbacksDb.set('fb-durable', fb);

  const backup = f.engine.createBackupSnapshot('alice', [fb], []);
  await f.engine.migrateFeedbacks('alice', [fb], { runId: backup.runId });
  assert.equal(f.feedbacksDb.get('fb-durable').imageIds.length, 1);

  // Simulate page reload / new engine instance reading from the same localStore
  const reloadedEngine = createMigrationEngine({
    auth: f.auth,
    imageStorage: null,
    firestore: f.firestore,
    localStore: f.localStore,
    now: () => 1700000099999
  });

  const list = reloadedEngine.listBackupSnapshots('alice');
  assert.equal(list.includes(backup.runId), true);

  const loaded = reloadedEngine.loadBackupSnapshot('alice', backup.runId);
  assert.equal(loaded.ownerUid, 'alice');
  assert.equal(loaded.feedbacks.length, 1);

  const rollback = await reloadedEngine.rollbackFeedbackImages('alice', backup.runId);
  assert.equal(rollback.restored, 1);
  assert.deepEqual(f.feedbacksDb.get('fb-durable').imageIds, []);
});

test('Notes migration enforces revision-based concurrent-write protection even with skewed timestamps', async () => {
  const f = createFixture({ uid: 'alice' });
  f.localStore.setItem('zerocoder_notes_alice', JSON.stringify([{
    id: 'note-rev',
    title: 'Local Rev 1',
    content: '<p>Local content</p>',
    updatedAt: 5000,
    revision: 1
  }]));

  // Remote note has higher revision (revision: 2) even if its clock timestamp is older/equal
  await f.firestore.saveNote('alice', 'note-rev', {
    id: 'note-rev',
    ownerUid: 'alice',
    title: 'Remote Rev 2',
    content: '<p>Remote content</p>',
    updatedAt: 4000,
    revision: 2
  });

  const report = await f.engine.migrateNotes('alice', { runId: 'rev-check' });
  assert.equal(report.skippedConflicts, 1);
  assert.equal(report.migratedNotes, 0);
  assert.equal((await f.firestore.getNote('alice', 'note-rev')).title, 'Remote Rev 2');
});

test('Feedback rollback never overwrites post-snapshot edits even when imageMigration.runId is unchanged', async () => {
  const f = createFixture({ uid: 'alice' });
  const fb = { id: 'fb-same-runid', userId: 'alice', imageUrls: [PNG_DATA_URL], imageIds: [], updatedAt: 1000 };
  f.feedbacksDb.set('fb-same-runid', fb);

  const backup = f.engine.createBackupSnapshot('alice', [fb]);
  await f.engine.migrateFeedbacks('alice', [fb], { runId: backup.runId });

  // Simulate user editing feedback text after backup without altering imageMigration.runId
  const after = f.feedbacksDb.get('fb-same-runid');
  f.feedbacksDb.set('fb-same-runid', {
    ...after,
    description: 'Post-migration user edit',
    updatedAt: backup.createdAt + 1000
  });

  const rollback = await f.engine.rollbackFeedbackImages('alice', backup.runId);
  assert.equal(rollback.restored, 0);
  assert.equal(rollback.skippedNewerEdits, 1);
  assert.equal(f.feedbacksDb.get('fb-same-runid').imageIds.length, 1);
  assert.equal(f.feedbacksDb.get('fb-same-runid').description, 'Post-migration user edit');
});

test('Migration fails closed if transactional adapter methods are missing', async () => {
  const f = createFixture({ uid: 'alice' });
  f.localStore.setItem('zerocoder_notes_alice', JSON.stringify([
    { id: 'n1', title: 'T', content: '<p>Hi</p>', updatedAt: 1000 }
  ]));
  const nonTxEngine = createMigrationEngine({
    auth: f.auth,
    imageStorage: null,
    firestore: { getNote: async () => null, saveNote: async () => {} },
    localStore: f.localStore
  });

  await assert.rejects(() => nonTxEngine.migrateNotes('alice'), /saveNoteIfUnchanged/i);
  await assert.rejects(() => nonTxEngine.rollbackFeedbackImages('alice', 'missing-run'), /rollbackFeedbackIfUnchanged/i);
});

test('Notes partial image failure (missing cache or failed R2 upload) omits local UUIDs from imageIds and retries cleanly', async () => {
  const f = createFixture({ uid: 'alice', failOnCall: 2 });
  const uuid1 = '11111111-1111-1111-1111-111111111111';
  const uuid2 = '22222222-2222-2222-2222-222222222222';
  const uuidMissing = '33333333-3333-3333-3333-333333333333';

  f.cacheMap.set(`alice/${uuid1}`, { id: uuid1, blob: new Blob([PNG_BYTES], { type: 'image/png' }) });
  f.cacheMap.set(`alice/${uuid2}`, { id: uuid2, blob: new Blob([JPG_BYTES], { type: 'image/jpeg' }) });

  f.localStore.setItem('zerocoder_notes_alice', JSON.stringify([{
    id: 'note-partial',
    title: 'Partial Images',
    content: `<img data-image-id="${uuid1}"><img data-image-id="${uuid2}"><img data-image-id="${uuidMissing}">`,
    updatedAt: 1000
  }]));

  const report = await f.engine.migrateNotes('alice', { runId: 'partial-run' });
  assert.equal(report.migratedImages, 1);
  assert.equal(report.failedImages, 2);
  assert.equal(report.pendingImages.length, 2);

  const saved = await f.firestore.getNote('alice', 'note-partial');
  assert.equal(saved.imageIds.length, 1);
  assert.match(saved.imageIds[0], /^[a-f0-9]{64}$/);
  assert.equal(saved.imageIds.includes(uuid2), false);
  assert.equal(saved.imageIds.includes(uuidMissing), false);
  assert.equal(saved.migrationId, null);
});

test('Backup creation rolls back orphan snapshot key on index quota error and omits unused notes payload', () => {
  const storeMap = new Map();
  let throwOnIndex = true;
  const quotaStore = {
    getItem: (k) => storeMap.get(k) ?? null,
    setItem: (k, v) => {
      if (throwOnIndex && k.startsWith('zerocoder_migration_backups_')) {
        throw new Error('QuotaExceededError');
      }
      storeMap.set(k, v);
    },
    removeItem: (k) => storeMap.delete(k)
  };
  const auth = { currentUser: { uid: 'alice' } };
  const engine = createMigrationEngine({ auth, firestore: {}, localStore: quotaStore, now: () => 1700000000000 });

  assert.throws(
    () => engine.createBackupSnapshot('alice', [{ id: 'fb-1', userId: 'alice', imageUrls: [PNG_DATA_URL] }]),
    /QuotaExceededError/i
  );
  // Orphan snapshot key must be cleaned up
  assert.equal(storeMap.size, 0);

  // Successful backup excludes unused notes payload
  throwOnIndex = false;
  const snap = engine.createBackupSnapshot('alice', [{ id: 'fb-1', userId: 'alice', imageUrls: [PNG_DATA_URL] }]);
  assert.equal('notes' in snap, false);
});

test('Notes up-to-date detection never trusts migrationId alone when remote content or metadata changed', async () => {
  const f = createFixture({ uid: 'alice' });
  f.localStore.setItem('zerocoder_notes_alice', JSON.stringify([{
    id: 'note-up',
    title: 'Note Title',
    content: '<p>Local v1</p>',
    tags: ['a'],
    updatedAt: 2000,
    revision: 2
  }]));

  // Remote has the SAME migrationId ('same-run') but different content/revision
  await f.firestore.saveNote('alice', 'note-up', {
    id: 'note-up',
    ownerUid: 'alice',
    title: 'Note Title',
    content: '<p>Remote edited</p>',
    tags: ['a'],
    updatedAt: 2000,
    revision: 3,
    migrationId: 'same-run'
  });

  const conflictReport = await f.engine.migrateNotes('alice', { runId: 'same-run' });
  assert.equal(conflictReport.skippedUpToDate, 0);
  assert.equal(conflictReport.skippedConflicts, 1);
  assert.equal((await f.firestore.getNote('alice', 'note-up')).content, '<p>Remote edited</p>');

  // Now align remote to exact local content/tags/updatedAt/revision -> true up_to_date
  await f.firestore.saveNote('alice', 'note-up', {
    id: 'note-up',
    ownerUid: 'alice',
    title: 'Note Title',
    content: '<p>Local v1</p>',
    tags: ['a'],
    updatedAt: 2000,
    revision: 2,
    imageIds: []
  });

  const upToDateReport = await f.engine.migrateNotes('alice', { runId: 'another-run' });
  assert.equal(upToDateReport.skippedUpToDate, 1);
  assert.equal(upToDateReport.migratedNotes, 0);
});

