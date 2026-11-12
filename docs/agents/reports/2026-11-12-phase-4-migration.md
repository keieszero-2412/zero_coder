# Phase 4 — Legacy data migration

Status: **PASS for local migration tooling, durable backups, dry-run, idempotency, transactional/revision conflict protection, and rollback tests**.
Actual production data migration remains **BLOCKED** pending Cloudflare R2 bucket provisioning, live Worker deployment, and explicit owner authorization.

Baseline: `3f5956b` (Phase 3 application integration). Definitive [Phase 1–6 plan](../plans/2026-11-09-firebase-r2-implementation.md).

## Deliverables & Safety Architecture

1. **Data URL Parser & Magic-Byte Validator (`src/utils/migration/dataUrl.js`):**
   - Decodes Base64 Data URLs (`image/png`, `image/jpeg`, `image/webp`, `image/gif`) into binary `Uint8Array` and `Blob`.
   - Enforces magic-byte signature matching against the declared MIME type; rejects spoofed or malformed URLs.

2. **Safe, Idempotent, Resumable Migration Engine (`src/utils/migration/legacyMigration.js`):**
   - **Non-Destructive Guarantee:** Never deletes or overwrites legacy Base64 Feedback `imageUrls`, `localStorage` Notes, or IndexedDB image originals.
   - **Dry-Run Manifest (`dryRun: true`):** Computes SHA-256 hashes, MIME types, byte sizes, and source-to-destination counts without writing to R2 or Firestore.
   - **Durable Pre-Migration Backup (`createBackupSnapshot` / `loadBackupSnapshot`):** Persists frozen snapshots durably to `localStore` under `zerocoder_migration_backup_{uid}_{runId}` (indexed by `zerocoder_migration_backups_{uid}`) so backups survive page reloads, browser crashes, and interrupted runs.
   - **Feedback Base64 → R2 (`migrateFeedbacks`):**
     - Verifies `auth.currentUser.uid === uid` before and after every async step; aborts immediately on account switch.
     - Skips already-verified feedbacks (`imageMigration.status === 'verified'`).
     - Verifies SHA-256, byte size, MIME type, and UID ownership after each upload.
     - Records partial progress (`status: 'partial'`) on interrupted uploads so retries resume cleanly without duplicating R2 objects.
   - **Notes Local → Firestore & IndexedDB → R2 (`migrateNotes`):**
     - Strictly UID-isolated (`zerocoder_notes_${uid}`); never reads another account's localStorage. Explicit `adoptGuest: true` opt-in only.
     - Retains `title`, `content`, `tags`, `source`, `createdAt`, `updatedAt`, `imageIds`, and `migrationId`.
     - Concurrent edit protection: checks both `remote.revision > local.revision` and `remote.updatedAt > local.updatedAt` and uses Firestore transactions (`saveNoteIfUnchanged`) to prevent overwrites even with skewed client clocks.
   - **Image-Only Rollback (`rollbackFeedbackImages`):**
     - Uses Firestore transactions (`rollbackFeedbackIfUnchanged`) to restore pre-migration `imageIds` and `imageMigration` from durable backup snapshots only when no newer user/admin edits occurred.

3. **Firestore Migration Adapter (`src/utils/migration/firestoreAdapter.js`):**
   - Transactional Firestore adapter (`runTransaction`) for operator-authorized production execution in Phase 6. Not executed against production in Phase 4.

## Data Status & Authorization Matrix

| Data Category | Current State | Location | Action Requiring Owner Authorization |
|---|---|---|---|
| Legacy Feedback Base64 screenshots | **Preserved untouched** | Firestore `/feedbacks/{id}.imageUrls` | Provision R2 + run operator migration |
| Legacy localStorage Notes | **Preserved untouched** | Browser `zerocoder_notes_{uid}` | User sign-in / operator-authorized sync |
| Legacy IndexedDB Note images | **Preserved untouched** | Browser `zerocoder-note-images` | Provision R2 + Worker activation |
| Migration tooling & tests | **Implemented & verified locally** | `src/utils/migration/`, `tests/migration/` | None (ready) |

## Verification & Test Evidence

| Test Suite / Tool | Environment | Cases | Result |
|---|---|---:|---|
| `tests/migration/phase4-migration.test.mjs` | Node test runner (transactional mock R2 & Firestore fixtures) | 14 / 14 | **PASS** |
| `tests/integration/phase3-app.test.mjs` | Node test runner | 7 / 7 | **PASS** |
| `tests/images/*.test.mjs` | Node test runner | 15 / 15 | **PASS** |
| `tests/regression/phase5-regression.test.mjs` | Node test runner | 4 / 4 | **PASS** |
| `scratch/run_offline_tests.cjs` | Offline test runner | 15 / 15 | **PASS** |
| `tools/agents/check-config.mjs` | Structural link & metadata checker | 31 files, 84 links | **PASS** (0 errors) |
| `npm run lint` (`oxlint`) | Source linter | 76 files | **PASS** (0 errors, 109 warnings in legacy code) |
| `npm run build` (`vite build`) | Production Vite compiler | 2,216 modules | **PASS** |

## Post-Audit Hardening (Phase 4)
- **Feedback Rollback Concurrency Guard:** Made `evaluateFeedbackRollback` / `rollbackFeedbackIfUnchanged` independent of `imageMigration.runId`, blocking rollback whenever `currentUpdated > backupCreatedAt`.
- **Transactional Adapter Enforcement & Coverage:** Removed non-transactional fallback branches in `legacyMigration.js`; extracted shared `evaluateFeedbackRollback` and `evaluateNoteWrite` helpers in `firestoreAdapter.js` and updated `phase4-migration.test.mjs` fixtures to exercise `saveNoteIfUnchanged` and `rollbackFeedbackIfUnchanged` directly.
- **Notes Partial Image Failure:** `migrateNotes` no longer appends failed local UUIDs to `imageIds` and records `migrationId: null` while preserving retryable `pendingImages`.
- **Backup Reliability:** `createBackupSnapshot` now requires persistent `localStore`, drops unused `notes` payload, surfaces quota errors explicitly, and rolls back orphan snapshot keys if index updates fail.
- **Up-to-Date Detection:** `evaluateNoteWrite` never treats matching `migrationId` alone as `up_to_date`; verifies `updatedAt`, `content`, `title`, `tags`, and `imageIds`.

## External Blockers

1. **Cloudflare R2 & Worker Provisioning:** Actual cloud migration cannot execute until the owner provisions `zerocoder-images-private` and deploys the Worker.
2. **Owner Authorization:** Production migration requires explicit operator approval.

## Next Phase

Proceed to **Phase 5 — Admin, Functionality & Regression Verification**.
