export const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const formats = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const keyPart = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value);
export const sha256 = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
export function assertImageContext({ ownerUid, feature, parentId }) {
  if (!keyPart(ownerUid) || ownerUid.length > 128 || !keyPart(parentId) || !['notes', 'feedback', 'notebook'].includes(feature)) throw new Error('Invalid image owner or relationship.');
}
export async function prepareOriginal(blob, context) {
  assertImageContext(context);
  const extension = formats[blob?.type];
  if (!extension || !blob.size || blob.size > MAX_ORIGINAL_BYTES) throw new Error('Choose a PNG, JPEG, WebP or GIF original up to 10 MiB.');
  const bytes = new Uint8Array(await blob.arrayBuffer()), ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const valid = extension === 'png' ? [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)
    : extension === 'jpg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : extension === 'webp' ? ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP' : ['GIF87a', 'GIF89a'].includes(ascii(0,6));
  if (!valid) throw new Error('Image signature does not match its declared type.');
  const hash = await sha256(bytes);
  const id = await sha256(new TextEncoder().encode(JSON.stringify([context.ownerUid, context.feature, context.parentId, hash])));
  return { ...context, id, sha256: hash, contentType: blob.type, extension, size: blob.size,
    filename: String(blob.name || `original.${extension}`).replace(/[\r\n\x00-\x1f]/g, '').slice(0,160),
    objectKey: `images/v1/${context.ownerUid}/${context.feature}/${id}.${extension}`, blob };
}
export async function verifyOriginal(blob, metadata) {
  if (!blob || blob.size !== metadata.size || await sha256(await blob.arrayBuffer()) !== metadata.sha256) throw new Error('Original image integrity verification failed.');
  return blob;
}
