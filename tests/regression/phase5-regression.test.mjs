import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveAccess, basicAccessEnabled } from '../../src/utils/accessPolicy.js';
import { extractImageIds } from '../../src/utils/notesStorage.js';
import { getNoteImage } from '../../src/utils/notesImages.js';
import { createImageWorker } from '../../workers/images/src/index.js';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';

test('Access Code matrix: Green, Blue, Gray, Red, bypass, and revocation', () => {
  // 1. Green (trusted Admin claim only)
  assert.deepEqual(resolveAccess({ admin: true }, { code: 'Red' }, null, false), { role: 'Admin', colorCode: 'Green' });

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
    verifyToken: async (token) => ({ sub: token === 'admin' ? 'support' : 'alice', admin: token === 'admin' }),
    makeRepository: () => repository
  });
  const env = { IMAGES_ENABLED: 'true', FIREBASE_PROJECT_ID: 'demo-zerocoder', ALLOWED_ORIGINS: 'https://app.example', PRIVATE_R2: bucket };

  const meta = await prepareOriginal(png, { ownerUid: 'alice', feature: 'notes', parentId: 'n1' });
  await worker.fetch(new Request(`https://images.example/v1/images/${meta.id}?feature=notes&parentId=n1`, {
    method: 'PUT',
    headers: { Origin: 'https://app.example', Authorization: 'Bearer alice', 'Content-Type': 'image/png', 'X-Image-SHA256': meta.sha256 },
    body: png
  }), env);

  // Admin cannot delete another user's image
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
