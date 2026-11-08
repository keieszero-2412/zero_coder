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
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('zerocoder-note-images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(new Error('Image storage is unavailable. Free browser storage and retry.')); };
  });
  return database;
}

async function imageRecord(id, record) {
  const db = await openDatabase();
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
  const id = crypto.randomUUID();
  const record = { id, blob: file, extension, width: decoded.naturalWidth, height: decoded.naturalHeight, createdAt: Date.now(), owner: uid || 'guest' };
  onProgress({ percent: 5, message: 'Saving image locally' });
  await imageRecord(id, record);
  await onStored(record);
  // Local bytes are durable before any cloud request; denied/offline uploads never lose the image.
  if (uid && navigator.onLine) {
    let task;
    let timer;
    try {
      const [{ storage }, { ref, uploadBytesResumable }] = await Promise.all([import('../config/firebase'), import('firebase/storage')]);
      if (storage.app.options.storageBucket) {
        const path = `notes/${uid}/images/${id}.${extension}`;
        task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
        await new Promise((resolve, reject) => {
          timer = setTimeout(() => { task.cancel(); reject(new Error('Cloud upload timed out')); }, 8000);
          task.on('state_changed', (snapshot) => onProgress({ percent: Math.round(10 + snapshot.bytesTransferred / snapshot.totalBytes * 85), message: 'Uploading image' }), reject, resolve);
        });
        record.cloudPath = path;
        await imageRecord(id, record);
      }
    } catch {
      onProgress({ percent: 100, message: 'Saved locally — cloud storage unavailable' });
      return record;
    } finally { clearTimeout(timer); }
  }
  onProgress({ percent: 100, message: 'Image saved' });
  return record;
}

export async function getNoteImage(id) {
  if (!/^[a-f0-9-]{36}$/i.test(id || '')) throw new Error('Invalid image reference.');
  const record = await imageRecord(id);
  if (!record?.blob) throw new Error('Image is missing from this browser. Restore the original image to insert it again.');
  return record;
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
