import { auth } from '../config/firebase.js';
import { createImageStorage } from './imageStorage.js';
import { openImageDatabase } from './notesImages.js';

const imageCache = {
  async get(uid, type, id) {
    try {
      const db = await openImageDatabase();
      return await new Promise((resolve) => {
        const tx = db.transaction('images', 'readonly');
        const req = tx.objectStore('images').get(id);
        tx.oncomplete = () => {
          const result = req.result || null;
          if (result?.owner && result.owner !== 'guest' && uid && result.owner !== uid) {
            resolve(null);
            return;
          }
          resolve(result);
        };
        tx.onerror = tx.onabort = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  async put(uid, type, id, record) {
    try {
      const db = await openImageDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('images', 'readwrite');
        tx.objectStore('images').put({ ...record, id, owner: uid });
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => reject(new Error('Cache put failed'));
      });
    } catch {
      // Optional offline cache failure is non-fatal for memory/network operations
    }
  }
};

const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IMAGES_WORKER_URL) || '';
const enabled = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IMAGES_ENABLED === 'true');
const allowLoopback = (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true);

export const imageStorage = createImageStorage({
  auth,
  baseUrl,
  enabled,
  allowLoopback,
  cache: imageCache
});

export function isImagesConfigured() {
  return Boolean(enabled && baseUrl);
}

export { imageCache };
