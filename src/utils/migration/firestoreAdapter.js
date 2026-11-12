import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';

/**
 * Firestore adapter for legacy migration tooling.
 * Uses transactions for concurrent-write protection.
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
    async rollbackFeedbackIfUnchanged(id, expectedRunId, backupUpdatedAt, patch) {
      const ref = doc(db, 'feedbacks', id);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return { status: 'missing' };
        const current = snap.data();
        const currentUpdated = current.updatedAt?.toMillis ? current.updatedAt.toMillis() : (current.updatedAt || current.createdAt || 0);
        if (currentUpdated > backupUpdatedAt && current.imageMigration?.runId !== expectedRunId) {
          return { status: 'conflict' };
        }
        tx.update(ref, patch);
        return { status: 'restored' };
      });
    },
    async getNote(uid, noteId) {
      const snap = await getDoc(doc(db, 'users', uid, 'notes', noteId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    async saveNoteIfUnchanged(uid, noteId, localNote, buildPayload) {
      const ref = doc(db, 'users', uid, 'notes', noteId);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const remote = snap.exists() ? snap.data() : null;
        if (remote) {
          if ((remote.revision || 1) > (localNote.revision || 1) || (remote.updatedAt || 0) > (localNote.updatedAt || 0)) {
            return { status: 'conflict' };
          }
          if (remote.migrationId === localNote.migrationId || ((remote.updatedAt || 0) === (localNote.updatedAt || 0) && remote.content === localNote.content)) {
            return { status: 'up_to_date' };
          }
        }
        const nextRevision = remote ? (Number(remote.revision) || 1) + 1 : 1;
        const payload = buildPayload(nextRevision);
        tx.set(ref, payload);
        return { status: 'migrated', revision: nextRevision };
      });
    }
  };
}
