import { prepareOriginal } from './imageOriginal.js';
import { imageStorage, isImagesConfigured } from './imageService.js';

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

export async function validateImage(file) {
  const extension = TYPES[file.type];
  if (!extension) throw new Error('Choose a PNG, JPEG, WebP, or GIF image.');
  if (!file.size || file.size > MAX_BYTES) throw new Error('Images must be between 1 byte and 10 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const valid = extension === 'png' ? [137,80,78,71,13,10,26,10].every((byte, i) => bytes[i] === byte)
    : extension === 'jpg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : extension === 'webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
    : ['GIF87a', 'GIF89a'].includes(ascii(0, 6));
  if (!valid) throw new Error('The image contents do not match its file type.');
  return extension;
}

let database;
export function openImageDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('zerocoder-note-images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(new Error('Image storage is unavailable. Free browser storage and retry.')); };
  });
  return database;
}

export async function imageRecord(id, record) {
  const db = await openImageDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('images', record ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('images');
    const request = record ? store.put(record) : store.get(id);
    transaction.oncomplete = () => resolve(record || request.result);
    transaction.onerror = transaction.onabort = () => reject(new Error('Image could not be saved. Check available browser storage.'));
  });
}

export async function decodeImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 40000000) throw new Error('Images must be smaller than 40 megapixels.');
    return image;
  } catch {
    throw new Error('This image cannot be decoded or exceeds the 40-megapixel limit.');
  } finally { URL.revokeObjectURL(url); }
}

export async function storeNoteImage(file, uid, onProgress = () => {}, onStored = () => {}) {
  const extension = await validateImage(file);
  const decoded = await decodeImage(file);
  const now = Date.now();

  let originalMeta;
  let id;
  try {
    originalMeta = await prepareOriginal(file, { ownerUid: uid || 'guest', feature: 'notes', parentId: `local-${now}` });
    id = originalMeta.id;
  } catch {
    id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `img-${now}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const record = {
    id,
    blob: file,
    extension,
    width: decoded.naturalWidth,
    height: decoded.naturalHeight,
    createdAt: now,
    owner: uid || 'guest',
    sha256: originalMeta?.sha256 || null
  };

  onProgress({ percent: 10, message: 'Saving image locally' });
  await imageRecord(id, record);
  await onStored(record);

  // Cloudflare R2 synchronization via imageStorage
  if (uid && isImagesConfigured() && navigator.onLine) {
    try {
      onProgress({ percent: 40, message: 'Uploading to Cloudflare R2' });
      const ready = await imageStorage.save(file, {
        feature: 'notes',
        parentId: id,
        ownerUid: uid
      });
      record.cloudSynced = true;
      record.objectKey = ready.objectKey;
      await imageRecord(id, record);
      onProgress({ percent: 100, message: 'Image saved and synced to R2' });
      return record;
    } catch {
      onProgress({ percent: 100, message: 'Saved locally — R2 sync pending' });
      return record;
    }
  }

  onProgress({
    percent: 100,
    message: isImagesConfigured() ? 'Image saved' : 'Saved locally (cloud storage pending configuration)'
  });
  return record;
}

export async function getNoteImage(id, ownerUid = null) {
  if (!/^([a-f0-9-]{36}|[a-f0-9]{64}|img-[a-z0-9_-]+)$/i.test(id || '')) {
    throw new Error('Invalid image reference.');
  }
  const record = await imageRecord(id);
  if (record?.blob) return record;

  // Try to download from Cloudflare R2 if missing locally and configured
  if (ownerUid && isImagesConfigured() && navigator.onLine) {
    try {
      const downloaded = await imageStorage.download({ id, ownerUid, feature: 'notes' });
      if (downloaded?.blob) {
        await imageRecord(id, downloaded);
        return downloaded;
      }
    } catch {
      // Fall through to missing error
    }
  }

  throw new Error('Image is missing from this browser. Restore the original image to insert it again.');
}

export async function rasterImage(record, type = 'image/png') {
  const image = await decodeImage(record.blob);
  const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (type === 'image/jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, .92));
  if (!blob) throw new Error('Image could not be prepared for export.');
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
}
