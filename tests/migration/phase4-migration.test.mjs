import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImageDataUrl } from '../../src/utils/migration/dataUrl.js';
import { createMigrationEngine } from '../../src/utils/migration/legacyMigration.js';
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
    async getNote(ownerUid, noteId) {
      return notesDb.get(`${ownerUid}/${noteId}`) || null;
    },
    async saveNote(ownerUid, noteId, data) {
      notesDb.set(`${ownerUid}/${noteId}`, { ...data });
    }
  };

  const localMap = new Map();
  const localStore = {
    getItem: (k) => localMap.get(k) ?? null,
    setItem: (k, v) => localMap.set(k, v)
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

  // Verify note-local retained tags, source, and imageIds
  const localRemote = await f.firestore.getNote('alice', 'note-local');
  assert.equal(localRemote.title, 'Alice Study Note');
  assert.deepEqual(localRemote.tags, ['sql', 'midterm']);
  assert.deepEqual(localRemote.source, { category: 'Learn', course: 'database' });
  assert.equal(localRemote.imageIds.length, 1);

  // Verify localStorage was NOT deleted
  assert.ok(f.localStore.getItem('zerocoder_notes_alice'));
  assert.ok(f.cacheMap.get(`alice/${imgUuid}`));
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

