import { test } from 'node:test';
import assert from 'node:assert/strict';

const policy = await import('../../src/utils/accessPolicy.js');
const files = await import('../../src/utils/imageOriginal.js');
test('four Access Codes preserve Gray with bypass off, deny Red and require a trusted admin claim', () => {
  assert.equal(policy.resolveAccess({ admin: true }, { code: 'Red' }).colorCode, 'Green');
  for (const code of ['Blue', 'Gray']) assert.deepEqual(policy.resolveAccess({}, { code }), { role: 'User', colorCode: code });
  assert.equal(policy.resolveAccess({}, { code: 'Red' }, { code: 'Blue' }, true).role, 'Unauthorized');
  assert.equal(policy.resolveAccess({ role: 'Admin', colorCode: 'Green' }).role, 'Unauthorized');
  assert.equal(policy.resolveAccess({}, null, { code: 'Blue' }, false).role, 'Unauthorized');
  assert.equal(policy.resolveAccess({ email_verified: true }, null, { code: 'Blue' }).colorCode, 'Blue');
});
test('original identities are deterministic, account/feature/parent scoped and exact-byte verified', async () => {
  const blob = new Blob([new Uint8Array([137,80,78,71,13,10,26,10])], { type: 'image/png' });
  const context = { ownerUid: 'alice', feature: 'notes', parentId: 'n1' };
  const a = await files.prepareOriginal(blob, context), b = await files.prepareOriginal(blob, context);
  assert.equal(a.id, b.id); assert.equal(a.blob, blob);
  for (const change of [{ ownerUid: 'bob' }, { feature: 'feedback' }, { parentId: 'n2' }]) assert.notEqual((await files.prepareOriginal(blob, { ...context, ...change })).id, a.id);
  assert.match(a.objectKey, /^images\/v1\/alice\/notes\/[a-f0-9]{64}\.png$/);
  await files.verifyOriginal(blob, a);
  await assert.rejects(files.verifyOriginal(new Blob(['changed']), a), /integrity/i);
});
test('invalid types, disguised files, oversized data and unsafe relationship keys fail closed', async () => {
  const context = { ownerUid: 'alice', feature: 'notes', parentId: 'n1' };
  await assert.rejects(files.prepareOriginal(new Blob(['<svg/>'], { type: 'image/svg+xml' }), context));
  await assert.rejects(files.prepareOriginal(new Blob(['html'], { type: 'image/png' }), context));
  await assert.rejects(files.prepareOriginal(new Blob([new Uint8Array(10*1024*1024+1)], { type: 'image/png' }), context));
  await assert.rejects(files.prepareOriginal(new Blob(['x'], { type: 'image/png' }), { ...context, parentId: '../escape' }));
});
