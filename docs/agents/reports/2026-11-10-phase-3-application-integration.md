# Phase 3 — Application integration

Status: **PASS for local application integration, Notes Firestore synchronization, and dual legacy/R2 image support**.
Live Cloudflare deployment and R2 bucket provisioning remain **BLOCKED** pending owner-provisioned resources and explicit release authorization.

Baseline: `0032c1e` (Phase 2 security foundation and R2 infrastructure). Definitive [Phase 1–6 plan](../plans/2026-11-09-firebase-r2-implementation.md).

## Deliverables & Implementation Summary

1. **Phase 2 Compatibility & Hardening Verification:**
   - **Admin Access Code Model:** Verified complete original access model (`Green` for trusted Admin, `Blue` for full learning/course access, `Gray` for limited/trial or bypass mode, and `Red` for unauthorized/blocked). Trusted Admin authorization requires `claims.admin === true` verified against Firebase Auth `customAttributes`, completely independent of client-side profile inputs or user access codes.
   - **Privileged Service-Account Enforcement:** Audited `workers/images/src/metadata.js` to ensure privileged Google Cloud service-account calls enforce UID ownership and strict key formatting (`^[A-Za-z0-9_-]{1,128}$` for owner, `^[a-f0-9]{64}$` for image ID) server-side, preventing path traversal or cross-account access through privileged REST calls. Added regression test in `tests/images/metadata.test.mjs`.

2. **Feedback Widget R2 Integration & Backward Compatibility (`src/components/FeedbackWidget.jsx`, `src/components/AdminPanel.jsx`):**
   - New feedback attachments use `imageStorage.save` to route image uploads to Cloudflare R2, storing only verified reference IDs (`imageIds`) in the Firestore `/feedbacks/{id}` document with empty `imageUrls: []` per `firestore.rules`.
   - Clear degradation if R2 is unconfigured: notifies user that image uploads require cloud configuration, allowing text-only feedback submission.
   - Dual-mode image preview: renders legacy Base64 (`imageUrls` / `imageUrl`) directly, and downloads/previews R2 image attachments (`imageIds`) via authenticated Worker endpoint.
   - `AdminPanel.jsx` updated to preview both legacy Base64 screenshots and R2 screenshots securely.

3. **Notes Firestore Synchronization & Floating HUD Preservation (`src/pages/Notes.jsx`, `src/utils/notesStorage.js`):**
   - Strictly preserved the original floating/draggable HUD UI, keyboard controls, editor formatting toolbar, tags, search, and six themes.
   - Structured notes content and metadata synchronize to `/users/{uid}/notes/{id}` in Firestore using optimistic revision numbers (`revision == 1` on creation, `revision + 1` on update).
   - Real-time `onSnapshot` listener merges remote edits with local cache seamlessly.
   - Soft-delete implemented via `deleted: true` and revision increment, respecting Firestore security rules.
   - Offline-first: IndexedDB and localStorage persist notes immediately before any network request; offline edits remain accessible and queued.

4. **Note Images via Shared R2 Client & IndexedDB Cache (`src/utils/notesImages.js`, `src/utils/imageService.js`):**
   - Removed all `firebase/storage` imports and SDK dependencies from `src/config/firebase.js` and `src/utils/notesImages.js`.
   - `storeNoteImage` persists original image binaries into IndexedDB (`zerocoder-note-images`), and synchronizes to R2 via `imageStorage.save` when signed in and online.
   - `getNoteImage` resolves from local IndexedDB first, downloading from R2 on demand if missing locally and caching for future offline use.
   - Supports both legacy 36-char UUIDs and 64-char SHA-256 hashes.

5. **Integration & Regression Testing (`tests/integration/phase3-app.test.mjs`):**
   - 7/7 automated tests covering note normalization, image extraction, account isolation, XSS HTML sanitization, unconfigured R2 error handling, account switching abort, and Access Code policy.

## Verification Matrix

| Test Suite / Tool | Target | Result | Evidence |
|---|---|:---:|---|
| `tests/images/*.test.mjs` | Worker & Storage Unit Tests | **PASS** | 15 / 15 tests passing |
| `tests/integration/*.test.mjs` | App Integration & Access Policy | **PASS** | 7 / 7 tests passing |
| `scratch/run_offline_tests.cjs` | Offline Regression Guard | **PASS** | 15 / 15 tests passing |
| `tools/agents/check-config.mjs` | Agent Config & Markdown Links | **PASS** | 28 files, 77 links, 0 errors |
| `npm run lint` (`oxlint`) | Code Linter | **PASS** | 71 files scanned, 0 errors |
| `npm run build` (`vite build`) | Production Vite Compiler | **PASS** | 2,216 modules transformed, 0 errors, no Firebase Storage |

## External Blockers & Non-Executable Items

1. **Cloudflare R2 Bucket & Worker Provisioning:** Requires owner creation of bucket `zerocoder-images-private` and Worker deployment with appropriate bindings.
2. **Google Cloud Service Account IAM:** Requires owner service account credentials for `zerocoder-8cb6b` with Firestore document permissions.
3. **Live R2 Cloud Verification:** Remains unasserted until bucket and Worker credentials are provided.

## Next Phase

Proceed to **Phase 4 — Legacy Data Migration**:
- Design and implement safe, idempotent, resumable migration of legacy Feedback Base64 images and Notes local images to R2.
- Implement migration of local Notes metadata to Firestore `/users/{uid}/notes`.
