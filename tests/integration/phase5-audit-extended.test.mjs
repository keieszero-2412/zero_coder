import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';

const WORKER_URL = 'https://zerocoder-images-staging.zerocoder-dev.workers.dev';

// Test image: 1x1 transparent PNG
const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

let stagingAuthToken = '';
let testUserUid = '';
let userAToken = '';

test.before(async () => {
  const confPath = join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  const conf = JSON.parse(readFileSync(confPath, 'utf8'));
  stagingAuthToken = conf.tokens.access_token;

  const keyListRes = await fetch('https://apikeys.googleapis.com/v2/projects/zerocoder-staging/locations/global/keys', {
    headers: { Authorization: 'Bearer ' + stagingAuthToken }
  });
  const keyList = await keyListRes.json();
  const keyName = keyList.keys[0].name;

  const keyStringRes = await fetch('https://apikeys.googleapis.com/v2/' + keyName + '/keyString', {
    headers: { Authorization: 'Bearer ' + stagingAuthToken }
  });
  const keyData = await keyStringRes.json();
  const webApiKey = keyData.keyString;

  const emailA = `audit-user-${Date.now()}@zerocoder.staging`;
  const pwd = 'TestPassword123!';

  const signA = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${webApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password: pwd, returnSecureToken: true })
  });
  const signAData = await signA.json();
  assert.ok(signAData.idToken, 'User sign up succeeded');
  testUserUid = signAData.localId;
  userAToken = signAData.idToken;

  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/user_access/${testUserUid}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        code: { stringValue: 'Blue' },
        accessCode: { stringValue: 'Blue' },
        approved: { booleanValue: true },
        email: { stringValue: emailA },
        createdAt: { integerValue: String(Date.now()) }
      }
    })
  });
});

test('Audit 1: Missing feature query parameter is rejected with 400 Bad Request', async () => {
  const blob = new Blob([PNG_BYTES], { type: 'image/png' });
  const prep = await prepareOriginal(blob, {
    ownerUid: testUserUid,
    feature: 'notes',
    parentId: 'malformed-parent-1'
  });

  const url = `${WORKER_URL}/v1/images/${prep.id}?parentId=malformed-parent-1`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': prep.sha256,
      Origin: 'http://localhost:5173'
    },
    body: PNG_BYTES
  });

  assert.equal(res.status, 400, `Expected 400 for missing feature, got ${res.status}`);
  const err = await res.json();
  assert.equal(err.error, 'Invalid image relationship.');

  // Verify no metadata created in staging Firestore
  const docCheck = await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/images/${prep.id}`, {
    headers: { Authorization: 'Bearer ' + stagingAuthToken }
  });
  assert.equal(docCheck.status, 404, 'No Firestore document must be created on rejection');
});

test('Audit 2: Missing parentId query parameter is rejected with 400 Bad Request', async () => {
  const blob = new Blob([PNG_BYTES], { type: 'image/png' });
  const prep = await prepareOriginal(blob, {
    ownerUid: testUserUid,
    feature: 'notes',
    parentId: 'malformed-parent-2'
  });

  const url = `${WORKER_URL}/v1/images/${prep.id}?feature=notes`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': prep.sha256,
      Origin: 'http://localhost:5173'
    },
    body: PNG_BYTES
  });

  assert.equal(res.status, 400);
  const err = await res.json();
  assert.equal(err.error, 'Invalid image relationship.');
});

test('Audit 3: Invalid image ID format is rejected with 400 Bad Request', async () => {
  const badId = 'invalid!id#with$special*chars';
  const url = `${WORKER_URL}/v1/images/${badId}?feature=notes&parentId=test-p`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      Origin: 'http://localhost:5173'
    },
    body: PNG_BYTES
  });

  assert.equal(res.status, 400);
  const err = await res.json();
  assert.equal(err.error, 'Invalid image identity.');
});

test('Audit 4: Invalid content type (text/plain) is rejected with 400 Bad Request', async () => {
  const textPayload = new TextEncoder().encode('Not an image file');
  const dummyId = 'a'.repeat(64);
  const dummySha = 'b'.repeat(64);

  const url = `${WORKER_URL}/v1/images/${dummyId}?feature=notes&parentId=p1`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'text/plain',
      'X-Image-SHA256': dummySha,
      Origin: 'http://localhost:5173'
    },
    body: textPayload
  });

  assert.equal(res.status, 400);
  const err = await res.json();
  assert.equal(err.error, 'Choose a PNG, JPEG, WebP or GIF original up to 10 MiB.');
});

test('Audit 5: Disguised image binary (wrong magic bytes) is rejected with 400 Bad Request', async () => {
  const fakePng = new TextEncoder().encode('Fake PNG Header but actually text content');
  const dummyId = 'c'.repeat(64);
  const dummySha = 'd'.repeat(64);

  const url = `${WORKER_URL}/v1/images/${dummyId}?feature=notes&parentId=p1`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': dummySha,
      Origin: 'http://localhost:5173'
    },
    body: fakePng
  });

  assert.equal(res.status, 400);
  const err = await res.json();
  assert.equal(err.error, 'Image signature does not match its declared type.');
});

test('Audit 6: Unsupported HTTP method (POST) is rejected with 405 Method Not Allowed', async () => {
  const dummyId = 'e'.repeat(64);
  const url = `${WORKER_URL}/v1/images/${dummyId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      Origin: 'http://localhost:5173'
    }
  });

  assert.equal(res.status, 405);
  const err = await res.json();
  assert.equal(err.error, 'Method is not supported.');
});

test('Audit 7: Unknown path is safely rejected with 400 Invalid image identity', async () => {
  // Non-images path is rejected at front door with 400
  const res400A = await fetch(`${WORKER_URL}/unknown-path`, {
    headers: {
      Authorization: `Bearer ${userAToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  assert.equal(res400A.status, 400);
  const errA = await res400A.json();
  assert.equal(errA.error, 'Invalid image identity.');

  // Malformed images path is rejected with 400
  const res400B = await fetch(`${WORKER_URL}/v1/images/path/with/too/many/segments`, {
    headers: {
      Authorization: `Bearer ${userAToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  assert.equal(res400B.status, 400);
  const errB = await res400B.json();
  assert.equal(errB.error, 'Invalid image identity.');
});

test('Audit 8: Rollback & Interrupted Upload Compensation: pending image refuses application access and completes idempotently on retry without double quota', async () => {
  const blob = new Blob([PNG_BYTES], { type: 'image/png' });
  const prep = await prepareOriginal(blob, {
    ownerUid: testUserUid,
    feature: 'notes',
    parentId: 'interrupted-upload-1'
  });

  // Step 1: Pre-seed document in staging Firestore in 'pending' state (simulating an interruption before ready())
  const initialTime = Date.now();
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/images/${prep.id}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        id: { stringValue: prep.id },
        ownerUid: { stringValue: testUserUid },
        feature: { stringValue: 'notes' },
        parentId: { stringValue: 'interrupted-upload-1' },
        sha256: { stringValue: prep.sha256 },
        contentType: { stringValue: 'image/png' },
        extension: { stringValue: 'png' },
        filename: { stringValue: 'original.png' },
        objectKey: { stringValue: prep.objectKey },
        size: { integerValue: String(PNG_BYTES.length) },
        state: { stringValue: 'pending' },
        createdAt: { integerValue: String(initialTime) },
        reservedAt: { integerValue: String(initialTime) }
      }
    })
  });

  // Initialize quota to 1 upload, 67 bytes
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/image_quotas/${testUserUid}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        bytes: { integerValue: String(PNG_BYTES.length) },
        count: { integerValue: '1' },
        uploads: { integerValue: '1' },
        windowStart: { integerValue: String(initialTime) }
      }
    })
  });

  // Step 2: Query metadata from Worker — Worker rejects pending image with 409 Conflict
  const metaRes = await fetch(`${WORKER_URL}/v1/images/${prep.id}?metadata=1`, {
    headers: { Authorization: `Bearer ${userAToken}`, Origin: 'http://localhost:5173' }
  });
  assert.equal(metaRes.status, 409, 'Interrupted/pending image must reject read with 409 Conflict');
  const metaErr = await metaRes.json();
  assert.equal(metaErr.error, 'Original is pending, detached or deleted. Retry or recover it from the owning account.');

  // Verify GET binary also rejects pending image with 409
  const binRes = await fetch(`${WORKER_URL}/v1/images/${prep.id}`, {
    headers: { Authorization: `Bearer ${userAToken}`, Origin: 'http://localhost:5173' }
  });
  assert.equal(binRes.status, 409);

  // Step 3: Retry upload with valid binary through Worker PUT
  const retryUrl = `${WORKER_URL}/v1/images/${prep.id}?feature=notes&parentId=interrupted-upload-1`;
  const retryRes = await fetch(retryUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': prep.sha256,
      Origin: 'http://localhost:5173'
    },
    body: PNG_BYTES
  });

  const retryText = await retryRes.text();
  assert.equal(retryRes.status, 201, `Retry upload should succeed with 201: ${retryText}`);
  const retryBody = JSON.parse(retryText);
  assert.equal(retryBody.state, 'ready', 'Retry upload must transition image state to ready');

  // Step 4: Verify Quota was NOT double-counted (count remains 1, bytes remains 67)
  const quotaDocRes = await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/image_quotas/${testUserUid}`, {
    headers: { Authorization: 'Bearer ' + stagingAuthToken }
  });
  const quotaDoc = await quotaDocRes.json();
  assert.equal(Number(quotaDoc.fields.count.integerValue), 1, 'Retry must not increment image count');
  assert.equal(Number(quotaDoc.fields.bytes.integerValue), PNG_BYTES.length, 'Retry must not double count bytes');

  // Step 5: Verify R2 object is now readable and byte-identical
  const dlRes = await fetch(`${WORKER_URL}/v1/images/${prep.id}`, {
    headers: { Authorization: `Bearer ${userAToken}`, Origin: 'http://localhost:5173' }
  });
  assert.equal(dlRes.status, 200);
  const dlBytes = new Uint8Array(await dlRes.arrayBuffer());
  assert.deepEqual(dlBytes, PNG_BYTES);
});

test('Audit 9: Rollback / Cleanup Lock protects against mutation during active maintenance', async () => {
  // Pre-seed active cleanup lock
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/maintenance/image_cleanup`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        active: { booleanValue: true },
        runId: { stringValue: 'audit-lock-run' },
        startedAt: { integerValue: String(Date.now()) }
      }
    })
  });

  try {
    const blob = new Blob([PNG_BYTES], { type: 'image/png' });
    const prep = await prepareOriginal(blob, {
      ownerUid: testUserUid,
      feature: 'notes',
      parentId: 'lock-test-audit'
    });

    const res = await fetch(`${WORKER_URL}/v1/images/${prep.id}?feature=notes&parentId=lock-test-audit`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userAToken}`,
        'Content-Type': 'image/png',
        'X-Image-SHA256': prep.sha256,
        Origin: 'http://localhost:5173'
      },
      body: PNG_BYTES
    });

    assert.equal(res.status, 409, 'Must reject upload with 409 under active lock');

    // Verify no document was created in Firestore
    const docCheck = await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/images/${prep.id}`, {
      headers: { Authorization: 'Bearer ' + stagingAuthToken }
    });
    assert.equal(docCheck.status, 404, 'No document should be reserved when lock check fails');
  } finally {
    // Release lock
    await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/maintenance/image_cleanup`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          active: { booleanValue: false },
          finishedAt: { integerValue: String(Date.now()) }
        }
      })
    });
  }
});
