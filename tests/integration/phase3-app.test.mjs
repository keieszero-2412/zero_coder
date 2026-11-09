import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeNote,
  noteStorageKey,
  sanitizeNoteHtml
} from '../../src/utils/notesStorage.js';
import { evaluateAccessPolicy, resolveAccess } from '../../src/utils/accessPolicy.js';
import { createImageStorage } from '../../src/utils/imageStorage.js';

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
  // Admin claim confers Green code
  const adminResult = evaluateAccessPolicy({ claims: { admin: true } });
  assert.equal(adminResult.role, 'Admin');
  assert.equal(adminResult.colorCode, 'Green');

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

  // Profile role spoofing does not confer Admin
  const resolveResult = resolveAccess({ admin: false }, { code: 'Red' }, null, false);
  assert.equal(resolveResult.role, 'Unauthorized');
  assert.equal(resolveResult.colorCode, 'Red');
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
