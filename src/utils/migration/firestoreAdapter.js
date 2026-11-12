import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Firestore adapter for legacy migration tooling.
 * Only used when explicitly invoked by an authorized operator after R2 provisioning.
 */
export function createFirestoreMigrationAdapter(db) {
  return {
    async getFeedback(id) {
      const snap = await getDoc(doc(db, 'feedbacks', id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    async updateFeedback(id, patch) {
      await updateDoc(doc(db, 'feedbacks', id), patch);
    },
    async getNote(uid, noteId) {
      const snap = await getDoc(doc(db, 'users', uid, 'notes', noteId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    async saveNote(uid, noteId, data) {
      await setDoc(doc(db, 'users', uid, 'notes', noteId), data);
    }
  };
}
