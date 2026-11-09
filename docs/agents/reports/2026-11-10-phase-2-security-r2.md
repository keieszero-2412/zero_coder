# Phase 2 — Security foundation and R2 infrastructure

Status: **PASS for local security foundation, Worker infrastructure and emulator-verified rules**.
Live Cloudflare deployment, R2 bucket provisioning and production Firestore rule deployment remain **BLOCKED**
pending owner-provisioned resources and explicit release authorization.

Baseline: `10e2d92` (Phase 1 audit and implementation plan). Definitive [Phase 1–6 plan](../plans/2026-11-09-firebase-r2-implementation.md).

## Deliverables and Architecture

1. **Firestore Least-Privilege Security Rules (`firestore.rules`, `firestore.indexes.json`, `firebase.json`):**
   - Eliminates legacy open catch-all reads and writes.
   - Restricts user profiles (`/users/{uid}`) to UID owner reads and admin; prevents self-elevation to Green/Admin or custom color codes upon creation/update.
   - Enforces strict Access Codes (`Gray`, `Blue`, `Red`): Gray and Blue can read practice problems; explicit `Red` overrides bypass; client cannot tamper with grants in `/authorized_emails` or `/user_access`.
   - Isolates code drafts (`/code_drafts/{uid_problemId}`) and user practice progress (`/user_progress/{uid}`) strictly to the owning UID.
   - Enforces verified email (`email_verified == true`) and owning UID for access requests (`/access_requests/{uid}`).
   - Disallows Base64 image payloads in new Feedback submissions (`/feedbacks/{id}`), while preserving readability and text-editability of legacy feedback submissions.
   - Locks image metadata collections (`/users/{uid}/images/{id}`) so only the authenticated Worker IAM service identity can write verified R2 metadata; client writes are rejected.
   - Implements maintenance locks (`/users/{uid}/maintenance/image_cleanup`) to prevent concurrent reference creation during maintenance.

2. **Authenticated Cloudflare Worker for Private R2 (`workers/images/src/`):**
   - `firebaseToken.js`: Verifies Firebase ID tokens server-side using Google's public x509 certificates (cached with expiration), verifying project audience (`zerocoder-8cb6b` or `demo-zerocoder-r2`), signature, expiration, issuer, subject UID, and trusted `admin` custom claim.
   - `metadata.js`: Manages Firestore document metadata and transactional locks via Google Cloud REST API using Google OAuth2 JWT authentication with service account credentials (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), supporting both production and loopback emulator mode.
   - `index.js`: Exposes REST endpoints (`/v1/images/:sha256`) for PUT (upload), GET (download/retrieval with verified byte-integrity and range streaming), and DELETE (safe orphan deletion with maintenance locks and attachment verification).
   - Strict payload validation: Enforces `MAX_ORIGINAL_BYTES` (10 MiB), verified magic-byte MIME type (PNG, JPEG, WebP, GIF), SHA-256 digest match, and account ownership.
   - Security headers: Nosniff, private cache control, sandbox CSP, no-referrer, and origin validation via `ALLOWED_ORIGINS`.

3. **Client-Side Storage & Policy Utilities (`src/utils/`):**
   - `imageOriginal.js`: Pure byte-level utilities for SHA-256 calculation, image signature detection, dimensional checks, and canonical identity generation.
   - `imageStorage.js`: Reusable client for communicating with the Worker with retry logic, account switching isolation, and fallback handling.
   - `accessPolicy.js`: Authoritative client logic for evaluating membership and access codes.
   - `authActions.js`: Secure authentication actions (register, login, requestAccess, resetPassword) matching Firestore rules.

4. **Templates & Configuration (`workers/images/`):**
   - `wrangler.jsonc.example`: Worker configuration template defining environment variables (`IMAGES_ENABLED`, `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGINS`) and R2 binding (`PRIVATE_R2`).
   - `.env.example`: Secret template for `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (no real secrets committed).

## Verification and Test Evidence

| Test Suite | Environment | Cases | Result |
|---|---|---:|---|
| `tests/images/*.test.mjs` | Node test runner (mocked R2 & tokens) | 14 / 14 | **PASS** |
| `tests/firebase/*.test.mjs` | Local Firebase Emulator (Auth :9099, Firestore :8080) | 11 / 11 | **PASS** |
| `scratch/run_offline_tests.cjs` | Offline test runner | 15 / 15 | **PASS** |
| `tools/agents/check-config.mjs` | Structural link & metadata checker | 27 files, 75 links | **PASS** (0 errors) |
| `npm run lint` (`oxlint`) | Source linter | 68 files | **PASS** (0 errors, 105 warnings in legacy code) |
| `npm run build` (`vite build`) | Production Vite compiler | Full bundle | **PASS** (2,214 modules transformed) |

## External Blockers & Remaining Non-Executable Work

1. **Cloudflare Account & R2 Bucket Provisioning:** Owner must create the private R2 bucket (`zerocoder-images-private`) and deploy the Worker with appropriate bindings.
2. **Google Cloud Service Account IAM:** Owner must provision a service account for `zerocoder-8cb6b` with Firestore document editing permissions to configure Worker secrets.
3. **Firestore Rule Deployment:** Production Firestore rules remain unchanged until owner authorizes production deployment in Phase 6.

## Next Phase

Proceed to **Phase 3 — Application Integration**:
- Integrate `imageStorage.js` into `FeedbackWidget.jsx` (storing original images in R2, reference in Firestore).
- Integrate Firestore-based Notes document synchronization into `Notes.jsx` while strictly preserving the floating HUD UI, local cache, and offline editing capabilities.
