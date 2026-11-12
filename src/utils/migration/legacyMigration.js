import { prepareOriginal } from '../imageOriginal.js';
import { extractImageIds, normalizeNote, noteStorageKey } from '../notesStorage.js';
import { parseImageDataUrl } from './dataUrl.js';

const BACKUP_PREFIX = 'zerocoder_migration_backup_';
const BACKUP_INDEX_PREFIX = 'zerocoder_migration_backups_';

/**
 * Creates a safe, idempotent, resumable migration engine for legacy Feedback Base64
 * images, IndexedDB note images, and localStorage structured Notes.
 * Never deletes or overwrites legacy source data.
 */
export function createMigrationEngine({
  auth,
  imageStorage,
  firestore,
  localStore = typeof localStorage !== 'undefined' ? localStorage : null,
  imageCache,
  now = () => Date.now()
}) {
  function assertSession(uid) {
    if (!uid || typeof uid !== 'string') {
      throw new Error('Valid target UID is required for migration.');
    }
    if (auth?.currentUser?.uid !== uid) {
      throw new Error('Account changed or signed out. Migration aborted to preserve isolation.');
    }
  }

  /**
   * Builds and durably persists an immutable pre-migration backup snapshot
   * so snapshots survive page reloads, browser crashes, and interrupted runs.
   */
  function createBackupSnapshot(uid, feedbacks = [], localNotes = []) {
    assertSession(uid);
    const runId = `mig-${now()}-${Math.random().toString(36).slice(2, 8)}`;
    const snapshot = Object.freeze({
      runId,
      ownerUid: uid,
      createdAt: now(),
      feedbacks: feedbacks
        .filter((fb) => fb.userId === uid)
        .map((fb) => Object.freeze({
          id: fb.id,
          imageIds: Array.isArray(fb.imageIds) ? [...fb.imageIds] : [],
          imageUrls: Array.isArray(fb.imageUrls) ? [...fb.imageUrls] : (fb.imageUrl ? [fb.imageUrl] : []),
          imageMigration: fb.imageMigration ? { ...fb.imageMigration } : null,
          updatedAt: fb.updatedAt || fb.createdAt || 0
        })),
      notes: localNotes.map((n) => Object.freeze({ ...n }))
    });

    if (localStore) {
      const key = `${BACKUP_PREFIX}${uid}_${runId}`;
      if (localStore.getItem(key)) {
        throw new Error(`Immutable backup ${runId} already exists.`);
      }
      localStore.setItem(key, JSON.stringify(snapshot));
      const indexKey = `${BACKUP_INDEX_PREFIX}${uid}`;
      const existing = JSON.parse(localStore.getItem(indexKey) || '[]');
      if (!existing.includes(runId)) {
        existing.push(runId);
        localStore.setItem(indexKey, JSON.stringify(existing));
      }
    }

    return snapshot;
  }

  function loadBackupSnapshot(uid, runId) {
    assertSession(uid);
    if (!localStore) return null;
    const raw = localStore.getItem(`${BACKUP_PREFIX}${uid}_${runId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.ownerUid !== uid || parsed.runId !== runId) {
      throw new Error('Backup snapshot ownership or identity mismatch.');
    }
    return Object.freeze(parsed);
  }

  function listBackupSnapshots(uid) {
    assertSession(uid);
    if (!localStore) return [];
    const raw = localStore.getItem(`${BACKUP_INDEX_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * Migrates legacy Base64 Feedback screenshots to Cloudflare R2 while preserving original Base64 fields.
   */
  async function migrateFeedbacks(uid, feedbacks, { dryRun = false, runId = `mig-${now()}` } = {}) {
    assertSession(uid);
    const report = {
      runId,
      dryRun,
      totalInspected: 0,
      migrated: 0,
      skippedAlreadyVerified: 0,
      failed: 0,
      pending: [],
      verifiedObjects: [],
      errors: []
    };

    const ownedFeedbacks = feedbacks.filter((fb) => fb.userId === uid);
    report.totalInspected = ownedFeedbacks.length;

    for (const fb of ownedFeedbacks) {
      assertSession(uid);
      const legacyUrls = [
        ...(Array.isArray(fb.imageUrls) ? fb.imageUrls : []),
        ...(fb.imageUrl && (!fb.imageUrls || !fb.imageUrls.includes(fb.imageUrl)) ? [fb.imageUrl] : [])
      ].filter((u) => typeof u === 'string' && u.startsWith('data:image/'));

      if (legacyUrls.length === 0) {
        continue;
      }

      if (
        fb.imageMigration?.status === 'verified' &&
        Array.isArray(fb.imageIds) &&
        fb.imageIds.length >= legacyUrls.length
      ) {
        report.skippedAlreadyVerified++;
        continue;
      }

      const existingIds = Array.isArray(fb.imageIds) ? [...fb.imageIds] : [];
      const newIds = [...existingIds];
      const sha256s = [];
      let itemFailed = false;

      for (let i = 0; i < legacyUrls.length; i++) {
        assertSession(uid);
        try {
          const parsed = parseImageDataUrl(legacyUrls[i]);
          const expected = await prepareOriginal(parsed.blob, {
            ownerUid: uid,
            feature: 'feedback',
            parentId: fb.id
          });

          if (dryRun) {
            if (!newIds.includes(expected.id)) newIds.push(expected.id);
            sha256s.push(expected.sha256);
            report.verifiedObjects.push({
              feedbackId: fb.id,
              id: expected.id,
              sha256: expected.sha256,
              size: expected.size,
              mimeType: parsed.mimeType,
              ownerUid: uid,
              status: 'planned'
            });
            continue;
          }

          const saved = await imageStorage.save(parsed.blob, {
            feature: 'feedback',
            parentId: fb.id,
            ownerUid: uid
          });
          assertSession(uid);

          if (
            saved.sha256 !== expected.sha256 ||
            saved.size !== expected.size ||
            saved.ownerUid !== uid ||
            saved.contentType !== parsed.mimeType
          ) {
            throw new Error(`Integrity mismatch after upload for feedback ${fb.id} image ${i}.`);
          }

          if (!newIds.includes(saved.id)) newIds.push(saved.id);
          sha256s.push(saved.sha256);
          report.verifiedObjects.push({
            feedbackId: fb.id,
            id: saved.id,
            sha256: saved.sha256,
            size: saved.size,
            mimeType: saved.contentType,
            ownerUid: saved.ownerUid,
            status: 'verified'
          });
        } catch (err) {
          itemFailed = true;
          report.failed++;
          report.pending.push({ feedbackId: fb.id, index: i, error: err.message });
          report.errors.push({ feedbackId: fb.id, index: i, message: err.message });
          break;
        }
      }

      if (!dryRun) {
        if (!itemFailed && sha256s.length === legacyUrls.length) {
          await firestore.updateFeedback(fb.id, {
            imageIds: newIds,
            imageMigration: {
              runId,
              status: 'verified',
              migratedAt: now(),
              sourceCount: legacyUrls.length,
              verifiedCount: sha256s.length,
              sha256s
            }
          });
          report.migrated++;
        } else if (newIds.length > existingIds.length) {
          await firestore.updateFeedback(fb.id, {
            imageIds: newIds,
            imageMigration: {
              runId,
              status: 'partial',
              updatedAt: now(),
              sourceCount: legacyUrls.length,
              verifiedCount: sha256s.length,
              sha256s
            }
          });
        }
      } else if (!itemFailed) {
        report.migrated++;
      }
    }

    return report;
  }

  /**
   * Reads localStorage Notes strictly for the specified UID (or explicit guest adoption).
   */
  function readLocalNotesForUid(uid, { adoptGuest = false } = {}) {
    assertSession(uid);
    if (!localStore) return [];
    const rawUser = localStore.getItem(noteStorageKey(uid));
    const userNotes = rawUser ? JSON.parse(rawUser) : [];
    const normalized = Array.isArray(userNotes) ? userNotes.map(normalizeNote).filter((n) => !n.deleted) : [];

    if (adoptGuest) {
      const rawGuest = localStore.getItem(noteStorageKey('guest'));
      const guestNotes = rawGuest ? JSON.parse(rawGuest) : [];
      if (Array.isArray(guestNotes)) {
        const existingIds = new Set(normalized.map((n) => n.id));
        for (const gn of guestNotes.map(normalizeNote).filter((n) => !n.deleted)) {
          if (!existingIds.has(gn.id)) {
            normalized.push(gn);
          }
        }
      }
    }
    return normalized;
  }

  /**
   * Migrates localStorage Notes to Firestore and IndexedDB note images to Cloudflare R2.
   * Uses revision + timestamp preconditions and transactional writes when available.
   */
  async function migrateNotes(uid, { dryRun = false, adoptGuest = false, runId = `mig-${now()}` } = {}) {
    assertSession(uid);
    const localNotes = readLocalNotesForUid(uid, { adoptGuest });
    const report = {
      runId,
      dryRun,
      totalNotes: localNotes.length,
      migratedNotes: 0,
      skippedConflicts: 0,
      skippedUpToDate: 0,
      migratedImages: 0,
      failedImages: 0,
      pendingImages: [],
      verifiedObjects: [],
      errors: []
    };

    for (const note of localNotes) {
      assertSession(uid);
      const imageIds = extractImageIds(note.content);
      const migratedImageIds = [];
      let content = note.content;
      let noteImageFailed = false;

      for (const imgId of imageIds) {
        assertSession(uid);
        try {
          const cached = await imageCache?.get(uid, 'image', imgId);
          if (!cached?.blob) {
            throw new Error(`Original image ${imgId} missing from local IndexedDB cache.`);
          }

          const expected = await prepareOriginal(cached.blob, {
            ownerUid: uid,
            feature: 'notes',
            parentId: note.id
          });

          if (dryRun) {
            migratedImageIds.push(expected.id);
            report.migratedImages++;
            report.verifiedObjects.push({
              noteId: note.id,
              legacyId: imgId,
              id: expected.id,
              sha256: expected.sha256,
              size: expected.size,
              mimeType: expected.contentType,
              ownerUid: uid,
              status: 'planned'
            });
            continue;
          }

          const saved = await imageStorage.save(cached.blob, {
            feature: 'notes',
            parentId: note.id,
            ownerUid: uid
          });
          assertSession(uid);

          if (
            saved.sha256 !== expected.sha256 ||
            saved.size !== expected.size ||
            saved.ownerUid !== uid
          ) {
            throw new Error(`Integrity mismatch for note ${note.id} image ${imgId}.`);
          }

          migratedImageIds.push(saved.id);
          report.migratedImages++;
          report.verifiedObjects.push({
            noteId: note.id,
            legacyId: imgId,
            id: saved.id,
            sha256: saved.sha256,
            size: saved.size,
            mimeType: saved.contentType,
            ownerUid: saved.ownerUid,
            status: 'verified'
          });
        } catch (err) {
          noteImageFailed = true;
          report.failedImages++;
          report.pendingImages.push({ noteId: note.id, imageId: imgId, error: err.message });
          report.errors.push({ noteId: note.id, imageId: imgId, message: err.message });
          migratedImageIds.push(imgId);
        }
      }

      if (dryRun) {
        report.migratedNotes++;
        continue;
      }

      const buildPayload = (nextRevision) => ({
        id: note.id,
        ownerUid: uid,
        title: note.title,
        content,
        tags: note.tags,
        source: note.source,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        revision: nextRevision,
        imageIds: migratedImageIds,
        migrationId: noteImageFailed ? undefined : runId
      });

      if (typeof firestore.saveNoteIfUnchanged === 'function') {
        const outcome = await firestore.saveNoteIfUnchanged(uid, note.id, { ...note, migrationId: runId }, buildPayload);
        assertSession(uid);
        if (outcome.status === 'conflict') {
          report.skippedConflicts++;
        } else if (outcome.status === 'up_to_date') {
          report.skippedUpToDate++;
        } else {
          report.migratedNotes++;
        }
        continue;
      }

      const remote = await firestore.getNote(uid, note.id);
      assertSession(uid);

      if (remote) {
        if ((remote.revision || 1) > (note.revision || 1) || (remote.updatedAt || 0) > (note.updatedAt || 0)) {
          report.skippedConflicts++;
          continue;
        }
        if (remote.migrationId === runId || ((remote.updatedAt || 0) === (note.updatedAt || 0) && remote.content === content)) {
          report.skippedUpToDate++;
          continue;
        }
      }

      const nextRevision = remote ? (Number(remote.revision) || 1) + 1 : 1;
      await firestore.saveNote(uid, note.id, buildPayload(nextRevision));
      report.migratedNotes++;
    }

    return report;
  }

  /**
   * Image-only rollback that restores pre-migration feedback imageIds/imageMigration
   * using transactional/precondition checks without overwriting later user edits.
   */
  async function rollbackFeedbackImages(uid, backupOrRunId) {
    assertSession(uid);
    const backupSnapshot = typeof backupOrRunId === 'string'
      ? loadBackupSnapshot(uid, backupOrRunId)
      : backupOrRunId;

    if (!backupSnapshot || backupSnapshot.ownerUid !== uid) {
      throw new Error('Backup snapshot does not match current account or is missing.');
    }

    const result = {
      runId: backupSnapshot.runId,
      restored: 0,
      skippedNewerEdits: 0
    };

    for (const entry of backupSnapshot.feedbacks) {
      assertSession(uid);
      const patch = {
        imageIds: entry.imageIds,
        imageMigration: entry.imageMigration
      };

      if (typeof firestore.rollbackFeedbackIfUnchanged === 'function') {
        const outcome = await firestore.rollbackFeedbackIfUnchanged(
          entry.id,
          backupSnapshot.runId,
          backupSnapshot.createdAt,
          patch
        );
        if (outcome.status === 'conflict') result.skippedNewerEdits++;
        else if (outcome.status === 'restored') result.restored++;
        continue;
      }

      const current = await firestore.getFeedback(entry.id);
      if (!current) continue;

      const currentUpdated = current.updatedAt || current.createdAt || 0;
      if (currentUpdated > backupSnapshot.createdAt && current.imageMigration?.runId !== backupSnapshot.runId) {
        result.skippedNewerEdits++;
        continue;
      }

      await firestore.updateFeedback(entry.id, patch);
      result.restored++;
    }

    return result;
  }

  return {
    createBackupSnapshot,
    loadBackupSnapshot,
    listBackupSnapshots,
    migrateFeedbacks,
    migrateNotes,
    readLocalNotesForUid,
    rollbackFeedbackImages
  };
}
