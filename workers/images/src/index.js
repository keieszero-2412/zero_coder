import { MAX_ORIGINAL_BYTES, prepareOriginal, verifyOriginal, assertImageContext } from '../../../src/utils/imageOriginal.js';
import { createTokenVerifier } from './firebaseToken.js';
import { createFirestoreMetadata } from './metadata.js';

const failure = (status, message) => Object.assign(new Error(message), { status });
async function boundedBody(request) {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_ORIGINAL_BYTES)) throw failure(413, 'Original exceeds 10 MiB.');
  const reader = request.body?.getReader();
  if (!reader) throw failure(400, 'Original image is required.');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_ORIGINAL_BYTES) { await reader.cancel(); throw failure(413, 'Original exceeds 10 MiB.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (declared && Number(declared) !== size) throw failure(400, 'Original length mismatch.');
  return new Blob(chunks, { type: request.headers.get('content-type') || '' });
}
function secureHeaders(origin) {
  return { ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}), 'Vary':'Origin, Authorization',
    'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'none'; sandbox", 'Referrer-Policy':'no-referrer',
    'Access-Control-Expose-Headers':'X-Image-SHA256, Content-Disposition, Content-Length' };
}
export function createImageWorker({ verifyToken = createTokenVerifier(), makeRepository = createFirestoreMetadata } = {}) {
  // Best-effort isolate/IP burst protection. Distributed per-user quotas live in Firestore.
  const bursts = new Map();
  return { async fetch(request, env) {
    const origin = request.headers.get('origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    const headers = secureHeaders(origin && allowed.includes(origin) ? origin : null);
    const json = (value, status = 200) => Response.json(value, { status, headers });
    try {
      if (origin && !allowed.includes(origin)) throw failure(403, 'Origin is not allowed.');
      if (env.IMAGES_ENABLED !== 'true' || !env.PRIVATE_R2 || !env.FIREBASE_PROJECT_ID || !allowed.length) throw failure(503, 'Image storage is not configured. Keep the original and retry after activation.');
      if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:{ ...headers, 'Access-Control-Allow-Methods':'GET, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers':'Authorization, Content-Type, X-Image-SHA256', 'Access-Control-Max-Age':'600' } });
      const url = new URL(request.url), match = url.pathname.match(/^\/v1\/images\/([a-f0-9]{64})$/);
      if (!match) throw failure(400, 'Invalid image identity.');
      if (!['GET','PUT','DELETE'].includes(request.method)) throw failure(405, 'Method is not supported.');
      const ip = request.headers.get('cf-connecting-ip') || 'unknown', minute = Math.floor(Date.now()/60000);
      if (bursts.size > 1000) for (const [key, value] of bursts) if (value.minute !== minute) bursts.delete(key);
      if (bursts.size > 1000 && !bursts.has(ip)) throw failure(429, 'Image service busy. Retry later.');
      const burst = bursts.get(ip);
      if (burst?.minute === minute && burst.count >= 60) throw failure(429, 'Too many image requests. Retry later.');
      bursts.set(ip, { minute, count:burst?.minute === minute ? burst.count+1 : 1 });
      const bearer = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
      if (!bearer) throw failure(401, 'Sign in to use image storage.');
      let claims;
      try { claims = await verifyToken(bearer, env.FIREBASE_PROJECT_ID); } catch { throw failure(401, 'Firebase session is invalid or expired.'); }
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(claims.sub || '')) throw failure(400, 'Unsupported account identity.');
      const repository = makeRepository(env), identity = await repository.authorize(claims);
      if (!['Admin','User'].includes(identity.role)) throw failure(403, 'Workspace access is required.');
      const owner = url.searchParams.get('owner') || claims.sub, id = match[1];
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(owner)) throw failure(400, 'Invalid owner.');
      if (owner !== claims.sub && identity.role !== 'Admin') throw failure(403, 'Original belongs to another account.');
      if (request.method === 'PUT') {
        if (owner !== claims.sub) throw failure(403, 'Upload originals from their owning account.');
        const context = { ownerUid:claims.sub, feature:url.searchParams.get('feature'), parentId:url.searchParams.get('parentId') };
        try { assertImageContext(context); } catch { throw failure(400, 'Invalid image relationship.'); }
        const blob = await boundedBody(request); let original;
        try { original = await prepareOriginal(blob, context); } catch (error) { throw failure(400,error.message); }
        if (original.id !== id || original.sha256 !== request.headers.get('x-image-sha256')) throw failure(400, 'Original image identity/hash mismatch.');
        original.filename = String(url.searchParams.get('filename') || original.filename).replace(/[\r\n\x00-\x1f]/g,'').slice(0,160);
        const { blob: omitted, ...metadata } = original; void omitted;
        await repository.reserve(metadata);
        const bucket = env.PRIVATE_R2, previous = await bucket.head(original.objectKey);
        if (!previous) await bucket.put(original.objectKey,new Uint8Array(await blob.arrayBuffer()),{
          onlyIf:new Headers({ 'If-None-Match':'*' }), httpMetadata:{contentType:original.contentType},
          customMetadata:{ ownerUid:original.ownerUid,assetId:id,sha256:original.sha256 }
        });
        const uploaded = await bucket.get(original.objectKey);
        if (!uploaded || uploaded.size !== original.size || uploaded.customMetadata?.sha256 !== original.sha256 || uploaded.customMetadata?.ownerUid !== original.ownerUid) throw failure(409, 'Stored original identity mismatch. Source retained for recovery.');
        await verifyOriginal(new Blob([await uploaded.arrayBuffer()]), original);
        await repository.ready(metadata);
        return json({ ...metadata, state:'ready' },201);
      }
      const metadata = await repository.get(owner,id);
      if (!metadata) throw failure(404, 'Original image is unavailable.');
      const expectedKey = `images/v1/${owner}/${metadata.feature}/${id}.${metadata.extension}`;
      if (metadata.ownerUid !== owner || metadata.id !== id || metadata.objectKey !== expectedKey || metadata.size > MAX_ORIGINAL_BYTES) throw failure(409, 'Image metadata requires recovery.');
      if (owner !== claims.sub && !(identity.role === 'Admin' && metadata.feature === 'feedback')) throw failure(403, 'Original belongs to another account.');
      if (request.method === 'DELETE') {
        if (owner !== claims.sub) throw failure(403, 'Only the owner may request image deletion.');
        const result = await repository.cleanup(owner,id,async record => {
          const object = await env.PRIVATE_R2.get(record.objectKey);
          if (object) await verifyOriginal(new Blob([await object.arrayBuffer()]), record);
          await env.PRIVATE_R2.delete(record.objectKey);
        });
        return json(result,result.state === 'detached' ? 202 : 200);
      }
      if (metadata.state !== 'ready') throw failure(409, 'Original is pending, detached or deleted. Retry or recover it from the owning account.');
      if (url.searchParams.get('metadata') === '1') return json(metadata);
      const object = await env.PRIVATE_R2.get(metadata.objectKey);
      if (!object || object.size !== metadata.size || object.customMetadata?.sha256 !== metadata.sha256) throw failure(409, 'Original requires integrity recovery.');
      return new Response(object.body,{headers:{...headers,'Content-Type':metadata.contentType,'Content-Length':String(metadata.size),'X-Image-SHA256':metadata.sha256,
        'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(metadata.filename || `original.${metadata.extension}`)}`}});
    } catch (error) {
      const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : 503;
      return json({ error:status === 503 ? 'Image service unavailable. Original retained by the caller; retry later.' : error.message },status);
    }
  } };
}
export default createImageWorker();
