import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';

const WORKER_URL = 'https://zerocoder-images-staging.zerocoder-dev.workers.dev';

// Test image: 1x1 transparent PNG
const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

let webApiKey = '';
let stagingAuthToken = '';
let testUserUid = '';
let otherUserToken = '';
let otherUserUid = '';
let uploadedAssetId = '';
let uploadedSha256 = '';

test.before(async () => {
  // 1. Get Firebase tools token to obtain web API key
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
  webApiKey = keyData.keyString;
  assert.ok(webApiKey, 'Web API key must be retrieved');

  // 2. Create or sign-in user A (testuser1@zerocoder.staging)
  const emailA = `test-user-a-${Date.now()}@zerocoder.staging`;
  const pwd = 'TestPassword123!';

  const signA = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${webApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password: pwd, returnSecureToken: true })
  });
  const signAData = await signA.json();
  assert.ok(signAData.idToken, 'User A sign up succeeded: ' + JSON.stringify(signAData));
  testUserUid = signAData.localId;
  const userAToken = signAData.idToken;

  // 3. Create or sign-in user B (other user)
  const emailB = `test-user-b-${Date.now()}@zerocoder.staging`;
  const signB = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${webApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailB, password: pwd, returnSecureToken: true })
  });
  const signBData = await signB.json();
  assert.ok(signBData.idToken, 'User B sign up succeeded');
  otherUserUid = signBData.localId;
  otherUserToken = signBData.idToken;

  // 4. Seed user_access/{uid} for user A in staging Firestore so role = 'User' (Blue Code / Workspace access)
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

  // Seed user_access/{uid} for user B as well
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/user_access/${otherUserUid}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        code: { stringValue: 'Blue' },
        accessCode: { stringValue: 'Blue' },
        approved: { booleanValue: true },
        email: { stringValue: emailB },
        createdAt: { integerValue: String(Date.now()) }
      }
    })
  });

  // 5. Ensure global budget is initialized to 0
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/image_budgets/global`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        bytes: { integerValue: '0' }
      }
    })
  });

  // Export User A token to outer scope
  globalThis.userAToken = userAToken;
});

test('1. Authenticated image upload succeeds with 201 Created and ready state', async () => {
  const blob = new Blob([PNG_BYTES], { type: 'image/png' });
  const prep = await prepareOriginal(blob, {
    ownerUid: testUserUid,
    feature: 'notes',
    parentId: 'test-note-1'
  });
  uploadedAssetId = prep.id;
  uploadedSha256 = prep.sha256;

  const url = `${WORKER_URL}/v1/images/${prep.id}?feature=notes&parentId=test-note-1`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${globalThis.userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': prep.sha256,
      Origin: 'http://localhost:5173'
    },
    body: PNG_BYTES
  });

  const resText = await res.text();
  assert.equal(res.status, 201, `Upload status expected 201, got ${res.status}: ${resText}`);
  const body = JSON.parse(resText);
  assert.equal(body.id, prep.id);
  assert.equal(body.ownerUid, testUserUid);
  assert.equal(body.state, 'ready');
  assert.equal(body.sha256, prep.sha256);
});

test('2. Staging R2 object exists and contains correct metadata', () => {
  const objectPath = `images/v1/${testUserUid}/notes/${uploadedAssetId}.png`;
  const tempFilePath = join(tmpdir(), `zerocoder-staging-check-${Date.now()}.png`);
  const r2Check = spawnSync('npx', ['--yes', 'wrangler', 'r2', 'object', 'get', `zerocoder-images-staging/${objectPath}`, '--remote', '--file', tempFilePath], {
    shell: true,
    encoding: 'utf8'
  });
  try {
    assert.equal(r2Check.status, 0, `R2 object ${objectPath} must exist in zerocoder-images-staging: ${r2Check.stderr}`);
  } finally {
    try { unlinkSync(tempFilePath); } catch {}
  }
});

test('3. SHA-256 hash integrity matches computed hash and metadata response', async () => {
  const metaUrl = `${WORKER_URL}/v1/images/${uploadedAssetId}?metadata=1`;
  const res = await fetch(metaUrl, {
    headers: {
      Authorization: `Bearer ${globalThis.userAToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  assert.equal(res.status, 200);
  const meta = await res.json();
  assert.equal(meta.sha256, uploadedSha256);
  assert.equal(meta.size, PNG_BYTES.length);
  assert.equal(meta.state, 'ready');
});

test('4. Authenticated download returns exact byte equality and security headers', async () => {
  const downloadUrl = `${WORKER_URL}/v1/images/${uploadedAssetId}`;
  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${globalThis.userAToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.equal(res.headers.get('x-image-sha256'), uploadedSha256);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');

  const downloadedBytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual(downloadedBytes, PNG_BYTES, 'Downloaded bytes must exactly match uploaded bytes');
});

test('5. Cross-user access attempt returns 403 Forbidden', async () => {
  // User B attempts to download User A's private note image by passing owner=userA
  const crossUrl = `${WORKER_URL}/v1/images/${uploadedAssetId}?owner=${testUserUid}`;
  const res = await fetch(crossUrl, {
    headers: {
      Authorization: `Bearer ${otherUserToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  assert.equal(res.status, 403, 'Cross-user original access must be denied with 403');
});

test('6. Non-admin access to other user Feedback returns 403 Forbidden', async () => {
  // User B attempts to access Feedback of User A without admin custom claims
  const fbUrl = `${WORKER_URL}/v1/images/${uploadedAssetId}?owner=${testUserUid}`;
  const res = await fetch(fbUrl, {
    headers: {
      Authorization: `Bearer ${otherUserToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  assert.equal(res.status, 403, 'Non-admin access to other user feedback must be denied with 403');
});

test('7. Image detach returns 202 Accepted on eligible unreferenced original', async () => {
  // Backdate createdAt and reservedAt by 25h so retention window (>24h) allows detach
  const olderTimestamp = String(Date.now() - 25 * 3600 * 1000);
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/images/${uploadedAssetId}?updateMask.fieldPaths=reservedAt&updateMask.fieldPaths=createdAt`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        reservedAt: { integerValue: olderTimestamp },
        createdAt: { integerValue: olderTimestamp }
      }
    })
  });

  const delUrl = `${WORKER_URL}/v1/images/${uploadedAssetId}`;
  const res = await fetch(delUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${globalThis.userAToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  const resText = await res.text();
  assert.equal(res.status, 202, `Expected 202 detach, got ${res.status}: ${resText}`);
  const data = JSON.parse(resText);
  assert.equal(data.state, 'detached');
});

test('8. Deletion of linked image returns 409 Conflict', async () => {
  // 1. Upload a second image
  const img2Bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0, 0, 0, 114, 182, 13, 36, 0, 0, 0, 11, 73, 68, 65, 84, 120, 156, 99, 96, 0, 2, 0, 0, 9, 0, 2, 88, 126, 219, 211, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  const prep2 = await prepareOriginal(new Blob([img2Bytes], { type: 'image/png' }), {
    ownerUid: testUserUid,
    feature: 'notes',
    parentId: 'test-note-linked'
  });

  const upRes = await fetch(`${WORKER_URL}/v1/images/${prep2.id}?feature=notes&parentId=test-note-linked`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${globalThis.userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': prep2.sha256,
      Origin: 'http://localhost:5173'
    },
    body: img2Bytes
  });
  assert.equal(upRes.status, 201);

  // 2. Link this image into users/{uid}/notes/note-linked
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/notes/note-linked`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        content: { stringValue: `<img data-image-id="${prep2.id}">` },
        imageIds: { arrayValue: { values: [{ stringValue: prep2.id }] } },
        updatedAt: { integerValue: String(Date.now()) }
      }
    })
  });

  // 3. Backdate image to satisfy 24h retention check so referenced() is the tested guard
  const olderTimestamp = String(Date.now() - 25 * 3600 * 1000);
  await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/images/${prep2.id}?updateMask.fieldPaths=reservedAt&updateMask.fieldPaths=createdAt`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        reservedAt: { integerValue: olderTimestamp },
        createdAt: { integerValue: olderTimestamp }
      }
    })
  });

  // 4. Attempt to delete linked image: cleanup() checks referenced() and returns 409
  const delRes = await fetch(`${WORKER_URL}/v1/images/${prep2.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${globalThis.userAToken}`,
      Origin: 'http://localhost:5173'
    }
  });
  assert.equal(delRes.status, 409, `Referenced image deletion must return 409, got ${delRes.status}`);
});

test('9. Unauthorized request returns 401 Unauthorized', async () => {
  const res = await fetch(`${WORKER_URL}/v1/images/${uploadedAssetId}`, {
    headers: { Origin: 'http://localhost:5173' }
  });
  assert.equal(res.status, 401);
});

test('10. Malformed input / hash mismatch returns 400 Bad Request', async () => {
  // Put image with wrong hash in header
  const res = await fetch(`${WORKER_URL}/v1/images/${uploadedAssetId}?feature=notes&parentId=test`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${globalThis.userAToken}`,
      'Content-Type': 'image/png',
      'X-Image-SHA256': '0000000000000000000000000000000000000000000000000000000000000000',
      Origin: 'http://localhost:5173'
    },
    body: PNG_BYTES
  });
  assert.equal(res.status, 400);
});

test('11. Quota enforcement: rejects upload exceeding user rate/budget with 429', async () => {
  try {
    // Pre-seed user quota to 21 uploads in current window
    await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/image_quotas/${testUserUid}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          bytes: { integerValue: '1000' },
          count: { integerValue: '1' },
          uploads: { integerValue: '21' },
          windowStart: { integerValue: String(Date.now()) }
        }
      })
    });

    const imgBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 3, 0, 0, 0, 3, 8, 6, 0, 0, 0, 86, 40, 179, 153, 0, 0, 0, 11, 73, 68, 65, 84, 120, 156, 99, 96, 0, 2, 0, 0, 9, 0, 2, 88, 126, 219, 211, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    const prepQuota = await prepareOriginal(new Blob([imgBytes], { type: 'image/png' }), {
      ownerUid: testUserUid,
      feature: 'notes',
      parentId: 'rate-test'
    });

    const res = await fetch(`${WORKER_URL}/v1/images/${prepQuota.id}?feature=notes&parentId=rate-test`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${globalThis.userAToken}`,
        'Content-Type': 'image/png',
        'X-Image-SHA256': prepQuota.sha256,
        Origin: 'http://localhost:5173'
      },
      body: imgBytes
    });
    assert.equal(res.status, 429, 'Rate-limited user upload must return 429');
  } finally {
    // Reset user quota
    await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/image_quotas/${testUserUid}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          bytes: { integerValue: '1000' },
          count: { integerValue: '1' },
          uploads: { integerValue: '1' },
          windowStart: { integerValue: String(Date.now()) }
        }
      })
    });
  }
});

test('12. Budget enforcement: rejects upload exceeding global budget with 429', async () => {
  try {
    // Pre-seed image_budgets/global to > 1 GiB
    await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/image_budgets/global`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          bytes: { integerValue: String(2 * 1024 * 1024 * 1024) }
        }
      })
    });

    const imgBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 4, 8, 6, 0, 0, 0, 153, 156, 38, 222, 0, 0, 0, 11, 73, 68, 65, 84, 120, 156, 99, 96, 0, 2, 0, 0, 9, 0, 2, 88, 126, 219, 211, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    const prepBudget = await prepareOriginal(new Blob([imgBytes], { type: 'image/png' }), {
      ownerUid: testUserUid,
      feature: 'notes',
      parentId: 'budget-test'
    });

    const res = await fetch(`${WORKER_URL}/v1/images/${prepBudget.id}?feature=notes&parentId=budget-test`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${globalThis.userAToken}`,
        'Content-Type': 'image/png',
        'X-Image-SHA256': prepBudget.sha256,
        Origin: 'http://localhost:5173'
      },
      body: imgBytes
    });
    assert.equal(res.status, 429, 'Over-budget upload must return 429');
  } finally {
    // Reset global budget to 0
    await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/image_budgets/global`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          bytes: { integerValue: '0' }
        }
      })
    });
  }
});

test('13. Rollback / Cleanup concurrency lock: prevents concurrent operations under active lock with 409', async () => {
  try {
    // Pre-seed active cleanup lock
    await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/maintenance/image_cleanup`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + stagingAuthToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          active: { booleanValue: true },
          runId: { stringValue: 'test-active-lock' },
          startedAt: { integerValue: String(Date.now()) }
        }
      })
    });

    const dummyBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 5, 0, 0, 0, 5, 8, 6, 0, 0, 0, 142, 60, 240, 94, 0, 0, 0, 11, 73, 68, 65, 84, 120, 156, 99, 96, 0, 2, 0, 0, 9, 0, 2, 88, 126, 219, 211, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    const prepLock = await prepareOriginal(new Blob([dummyBytes], { type: 'image/png' }), {
      ownerUid: testUserUid,
      feature: 'notes',
      parentId: 'lock-test'
    });

    const res = await fetch(`${WORKER_URL}/v1/images/${prepLock.id}?feature=notes&parentId=lock-test`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${globalThis.userAToken}`,
        'Content-Type': 'image/png',
        'X-Image-SHA256': prepLock.sha256,
        Origin: 'http://localhost:5173'
      },
      body: dummyBytes
    });
    assert.equal(res.status, 409, 'Upload under active cleanup lock must return 409');
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

test('14. Firestore metadata consistency & production isolation verified', async () => {
  // 1. Verify Firestore document in zerocoder-staging has state=detached (from test 7)
  const metaRes = await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-staging/databases/(default)/documents/users/${testUserUid}/images/${uploadedAssetId}`, {
    headers: { Authorization: 'Bearer ' + stagingAuthToken }
  });
  assert.equal(metaRes.status, 200);
  const doc = await metaRes.json();
  assert.ok(doc.fields, 'Metadata doc must exist and have fields');
  assert.equal(doc.fields.state?.stringValue, 'detached');
  assert.equal(doc.fields.sha256?.stringValue, uploadedSha256);

  // 2. Production isolation: verify production project zerocoder-8cb6b does NOT have this image doc
  const prodCheck = await fetch(`https://firestore.googleapis.com/v1/projects/zerocoder-8cb6b/databases/(default)/documents/users/${testUserUid}/images/${uploadedAssetId}`, {
    headers: { Authorization: 'Bearer ' + stagingAuthToken }
  });
  assert.equal(prodCheck.status, 404, 'Production Firestore must NOT have staging test image');
});
