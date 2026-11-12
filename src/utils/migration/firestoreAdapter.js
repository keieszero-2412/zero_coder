import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';

/**
 * Evaluates whether a Feedback rollback can proceed without overwriting edits
 * made after the backup snapshot was created. Independent of imageMigration.runId.
 */
export function evaluateFeedbackRollback(current, backupCreatedAt) {
  const currentUpdated = current.updatedAt?.toMillis
    ? current.updatedAt.toMillis()
    : (current.updatedAt || current.createdAt || 0);
  if (currentUpdated > backupCreatedAt) {
    return { status: 'conflict' };
  }
  return { status: 'ok' };
}

/**
 * Evaluates whether a local Note should be written, skipped as up-to-date, or
 * rejected as a conflict against a remote Firestore note.
 * Never treats matching migrationId alone as proof that a note is up to date.
 */
export function evaluateNoteWrite(remote, localNote, expectedImageIds = null) {
  if (remote) {
    if ((remote.revision || 1) > (localNote.revision || 1) || (remote.updatedAt || 0) > (localNote.updatedAt || 0)) {
      return { status: 'conflict' };
    }
    const sameTags = JSON.stringify(remote.tags || []) === JSON.stringify(localNote.tags || []);
    const sameImages = !expectedImageIds || JSON.stringify(remote.imageIds || []) === JSON.stringify(expectedImageIds);
    if (
      (remote.updatedAt || 0) === (localNote.updatedAt || 0) &&
      remote.content === localNote.content &&
      (remote.title || '') === (localNote.title || '') &&
      sameTags &&
      sameImages
    ) {
      return { status: 'up_to_date' };
    }
  }
  const nextRevision = remote ? (Number(remote.revision) || 1) + 1 : 1;
  return { status: 'write', nextRevision };
}

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
    async rollbackFeedbackIfUnchanged(id, backupCreatedAt, patch) {
      const ref = doc(db, 'feedbacks', id);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return { status: 'missing' };
        const decision = evaluateFeedbackRollback(snap.data(), backupCreatedAt);
        if (decision.status !== 'ok') return decision;
        tx.update(ref, patch);
        return { status: 'restored' };
      });
    },
    async getNote(uid, noteId) {
      const snap = await getDoc(doc(db, 'users', uid, 'notes', noteId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    async saveNoteIfUnchanged(uid, noteId, localNote, buildPayload, expectedImageIds = null) {
      const ref = doc(db, 'users', uid, 'notes', noteId);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const remote = snap.exists() ? snap.data() : null;
        const decision = evaluateNoteWrite(remote, localNote, expectedImageIds);
        if (decision.status !== 'write') return decision;
        const payload = buildPayload(decision.nextRevision);
        tx.set(ref, payload);
        return { status: 'migrated', revision: decision.nextRevision };
      });
    }
  };
}
