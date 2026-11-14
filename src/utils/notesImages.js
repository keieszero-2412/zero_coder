import { prepareOriginal } from './imageOriginal.js';
import { imageStorage, isImagesConfigured } from './imageService.js';
import { extractImageIds } from './notesStorage.js';
import { parseImageDataUrl } from './migration/dataUrl.js';

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

export async function storeNoteImage(file, uid, onProgress = () => {}, onStored = () => {}, parentId = null) {
  const extension = await validateImage(file);
  const decoded = await decodeImage(file);
  const now = Date.now();
  const effectiveParentId = parentId || `local-${now}`;

  let originalMeta;
  let id;
  try {
    originalMeta = await prepareOriginal(file, { ownerUid: uid || 'guest', feature: 'notes', parentId: effectiveParentId });
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
    ownerUid: uid || 'guest',
    sha256: originalMeta?.sha256 || null
  };

  onProgress({ percent: 10, message: 'Saving image locally' });
  await imageRecord(id, record);
  await onStored(record);

  // Cloudflare R2 synchronization via imageStorage
  if (uid && uid !== 'guest' && isImagesConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      onProgress({ percent: 40, message: 'Uploading to Cloudflare R2' });
      const ready = await imageStorage.save(file, {
        feature: 'notes',
        parentId: parentId || id,
        ownerUid: uid
      });
      record.cloudSynced = true;
      record.objectKey = ready.objectKey;
      record.size = ready.size;
      record.contentType = ready.contentType;
      record.state = ready.state;
      await imageRecord(id, record);
      onProgress({ percent: 100, message: 'Image saved and synced to R2' });
      return record;
    } catch (error) {
      record.cloudSynced = false;
      record.state = 'pending';
      try {
        await imageRecord(id, record);
      } catch {
        // Ignore secondary IndexedDB write error while preserving returned record
      }
      console.warn('R2 image upload failed; saved locally for retry:', error?.message || error);
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
  const ownedLocally = !record?.owner || record.owner === 'guest' || !ownerUid || record.owner === ownerUid;
  if (record?.blob && ownedLocally) return record;

  // Try to download from Cloudflare R2 if missing locally and configured
  if (ownerUid && ownerUid !== 'guest' && isImagesConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const downloaded = await imageStorage.download({ id, ownerUid, feature: 'notes' });
      if (downloaded?.blob) {
        await imageRecord(id, { ...downloaded, owner: ownerUid, cloudSynced: true });
        return downloaded;
      }
    } catch {
      // Fall through to missing error
    }
  }

  throw new Error('Image is missing from this browser. Restore the original image to insert it again.');
}

/**
 * Migrates any inline data:image/*;base64 tags and pending offline IndexedDB images
 * referenced in a Note to Cloudflare R2 when configured and online.
 */
export async function syncPendingNoteImages(note, uid) {
  if (!note || typeof note.content !== 'string') {
    return { changed: false, content: note?.content || '', imageIds: note?.imageIds || [], syncedCount: 0, failedCount: 0 };
  }
  let updatedContent = note.content;
  let syncedCount = 0;
  let failedCount = 0;

  // 1. Convert any legacy inline data:image/...;base64 <img> tags to canonical IndexedDB + R2 references
  const dataUrlImgRegex = /<img\b[^>]*\bsrc=(["'])(data:image\/(?:png|jpeg|webp|gif);base64,[^"']+)\1[^>]*>/gi;
  const matches = [...updatedContent.matchAll(dataUrlImgRegex)];
  for (const match of matches) {
    if (/data-image-id=/i.test(match[0])) continue;
    try {
      const parsed = parseImageDataUrl(match[2]);
      const prep = await prepareOriginal(parsed.blob, { ownerUid: uid || 'guest', feature: 'notes', parentId: note.id });
      const rec = {
        id: prep.id,
        blob: parsed.blob,
        extension: parsed.ext,
        createdAt: Date.now(),
        owner: uid || 'guest',
        ownerUid: uid || 'guest',
        sha256: prep.sha256
      };
      if (uid && uid !== 'guest' && isImagesConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
        const ready = await imageStorage.save(parsed.blob, { feature: 'notes', parentId: note.id, ownerUid: uid });
        rec.id = ready.id;
        rec.sha256 = ready.sha256;
        rec.objectKey = ready.objectKey;
        rec.size = ready.size;
        rec.contentType = ready.contentType;
        rec.state = ready.state;
        rec.cloudSynced = true;
        syncedCount++;
      }
      await imageRecord(rec.id, rec);
      updatedContent = updatedContent.replace(match[0], `<img data-image-id="${rec.id}" alt="Note image">`);
    } catch {
      failedCount++;
    }
  }

  // 2. Upload any IndexedDB-cached note images that are not yet synced to R2
  const ids = extractImageIds(updatedContent);
  if (uid && uid !== 'guest' && isImagesConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
    for (const imgId of ids) {
      let record = null;
      try {
        record = await imageRecord(imgId);
      } catch {
        record = null;
      }
      if (!record?.blob) continue;
      if (record.owner && record.owner !== 'guest' && record.owner !== uid) continue;
      if (record.cloudSynced && /^[a-f0-9]{64}$/.test(imgId)) continue;

      try {
        const ready = await imageStorage.save(record.blob, {
          feature: 'notes',
          parentId: note.id,
          ownerUid: uid
        });
        const syncedRecord = {
          ...record,
          id: ready.id,
          owner: uid,
          ownerUid: uid,
          sha256: ready.sha256,
          objectKey: ready.objectKey,
          size: ready.size,
          contentType: ready.contentType,
          extension: ready.extension || record.extension,
          state: ready.state || 'ready',
          cloudSynced: true
        };
        await imageRecord(ready.id, syncedRecord);
        if (ready.id !== imgId) {
          updatedContent = updatedContent
            .replaceAll(`data-image-id="${imgId}"`, `data-image-id="${ready.id}"`)
            .replaceAll(`data-image-id='${imgId}'`, `data-image-id='${ready.id}'`);
        }
        syncedCount++;
      } catch (error) {
        try {
          await imageRecord(imgId, { ...record, state: 'pending', cloudSynced: false });
        } catch {
          // Ignore secondary IndexedDB write error
        }
        console.warn('Pending note image R2 sync failed:', error?.message || error);
        failedCount++;
      }
    }
  }

  return {
    changed: updatedContent !== note.content || syncedCount > 0,
    content: updatedContent,
    imageIds: extractImageIds(updatedContent),
    syncedCount,
    failedCount
  };
}

/**
 * Cleans up local IndexedDB note images no longer referenced by any active Note for the current UID,
 * and requests safe reference-checked R2 detach for cloud-synced images.
 */
export async function deleteUnusedNoteImages(notes, uid = null) {
  if (typeof indexedDB === 'undefined') return { removedLocal: 0, requestedRemote: 0 };
  const ownerKey = uid || 'guest';
  const usedIds = new Set();
  for (const note of notes || []) {
    for (const id of extractImageIds(note?.content)) usedIds.add(id);
    if (Array.isArray(note?.imageIds)) {
      for (const id of note.imageIds) usedIds.add(id);
    }
  }

  let db;
  try {
    db = await openImageDatabase();
  } catch {
    return { removedLocal: 0, requestedRemote: 0 };
  }

  const allRecords = await new Promise((resolve) => {
    const tx = db.transaction('images', 'readonly');
    const req = tx.objectStore('images').getAll();
    tx.oncomplete = () => resolve(Array.isArray(req.result) ? req.result : []);
    tx.onerror = tx.onabort = () => resolve([]);
  });

  const orphanRecords = allRecords.filter((rec) => {
    if (!rec?.id || usedIds.has(rec.id)) return false;
    const recOwner = rec.owner || 'guest';
    return recOwner === ownerKey;
  });

  let removedLocal = 0;
  let requestedRemote = 0;
  for (const rec of orphanRecords) {
    if (rec.cloudSynced && uid && uid !== 'guest' && isImagesConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
      try {
        await imageStorage.delete({ id: rec.id, ownerUid: uid });
        requestedRemote++;
      } catch {
        // Worker safely blocks deletion if referenced or within the 24h recovery window.
      }
    }
    try {
      await new Promise((resolve) => {
        const tx = db.transaction('images', 'readwrite');
        tx.objectStore('images').delete(rec.id);
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => resolve();
      });
      removedLocal++;
    } catch {
      // Best-effort local cleanup
    }
  }

  return { removedLocal, requestedRemote };
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
