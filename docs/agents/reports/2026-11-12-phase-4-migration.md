# Phase 4 — Legacy data migration

Status: **PASS for local migration tooling, dry-run, idempotency, conflict protection, and rollback tests**.
Actual production data migration remains **BLOCKED** pending Cloudflare R2 bucket provisioning, live Worker deployment, and explicit owner authorization.

Baseline: `3f5956b` (Phase 3 application integration). Definitive [Phase 1–6 plan](../plans/2026-11-09-firebase-r2-implementation.md).

## Deliverables & Safety Architecture

1. **Data URL Parser & Magic-Byte Validator (`src/utils/migration/dataUrl.js`):**
   - Decodes Base64 Data URLs (`image/png`, `image/jpeg`, `image/webp`, `image/gif`) into binary `Uint8Array` and `Blob`.
   - Enforces magic-byte signature matching against the declared MIME type; rejects spoofed or malformed URLs.

2. **Safe, Idempotent, Resumable Migration Engine (`src/utils/migration/legacyMigration.js`):**
   - **Non-Destructive Guarantee:** Never deletes or overwrites legacy Base64 Feedback `imageUrls`, `localStorage` Notes, or IndexedDB image originals.
   - **Dry-Run Manifest (`dryRun: true`):** Computes SHA-256 hashes, MIME types, byte sizes, and source-to-destination counts without writing to R2 or Firestore.
   - **Immutable Pre-Migration Backup (`createBackupSnapshot`):** Captures frozen snapshot of pre-migration Feedback `imageIds`/`imageUrls`/`imageMigration` and local Notes before any write.
   - **Feedback Base64 → R2 (`migrateFeedbacks`):**
     - Verifies `auth.currentUser.uid === uid` before and after every async step; aborts immediately on account switch.
     - Skips already-verified feedbacks (`imageMigration.status === 'verified'`).
     - Verifies SHA-256, byte size, MIME type, and UID ownership after every upload.
     - Records partial progress (`status: 'partial'`) on interrupted uploads so retries resume cleanly without duplicating R2 objects.
   - **Notes Local → Firestore & IndexedDB → R2 (`migrateNotes`):**
     - Strictly UID-isolated (`zerocoder_notes_${uid}`); never reads another account's localStorage. Explicit `adoptGuest: true` opt-in only.
     - Retains `title`, `content`, `tags`, `source`, `createdAt`, `updatedAt`, `imageIds`, and `migrationId`.
     - Concurrent edit protection: skips overwriting remote Firestore notes if `remote.updatedAt > local.updatedAt`.
   - **Image-Only Rollback (`rollbackFeedbackImages`):**
     - Restores pre-migration `imageIds` and `imageMigration` from the immutable backup snapshot only when no newer user/admin edits occurred (`currentUpdated <= backup.createdAt`).

3. **Firestore Migration Adapter (`src/utils/migration/firestoreAdapter.js`):**
   - Ready-to-wire Firestore adapter for operator-authorized production execution in Phase 6. Not executed against production in Phase 4.

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
| `tests/migration/phase4-migration.test.mjs` | Node test runner (isolated mock R2 & Firestore fixtures) | 7 / 7 | **PASS** |
| `tests/integration/phase3-app.test.mjs` | Node test runner | 7 / 7 | **PASS** |
| `tests/images/*.test.mjs` | Node test runner | 15 / 15 | **PASS** |
| `scratch/run_offline_tests.cjs` | Offline test runner | 15 / 15 | **PASS** |
| `tools/agents/check-config.mjs` | Structural link & metadata checker | 29 files, 79 links | **PASS** (0 errors) |
| `npm run lint` (`oxlint`) | Source linter | 75 files | **PASS** (0 errors, 109 warnings in legacy code) |
| `npm run build` (`vite build`) | Production Vite compiler | 2,216 modules | **PASS** |

## External Blockers

1. **Cloudflare R2 & Worker Provisioning:** Actual cloud migration cannot execute until the owner provisions `zerocoder-images-private` and deploys the Worker.
2. **Owner Authorization:** Production migration requires explicit operator approval.

## Next Phase

Proceed to **Phase 5 — Admin, Functionality & Regression Verification**:
- Verify all four Access Codes (`Green`, `Blue`, `Gray`, `Red`), admin approval, grant changes, and revocation.
- Verify cross-user isolation, Notes/Feedback regressions, Markdown/PDF/DOCX exports, six themes, responsive layouts, and reference-aware image cleanup.
