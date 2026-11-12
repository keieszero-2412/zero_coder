# IAM & Isolated Staging Security Audit

**Date:** 2026-11-12  
**Baseline Commit:** `5f53c8a`  
**Scope:** Read-only preparation of Design A staging architecture, Google Cloud IAM custom role verification, Git security hardening, and secret-free staging templates.
**Strict Constraints Enforced:** Zero cloud resources created; no Service Accounts, IAM bindings, credentials, or Workers deployed; production Firestore and R2 untouched.

---

## 1. Repository Security Hardening

- **`.gitignore` update:** Added `.dev.vars` and `workers/images/.dev.vars` to `.gitignore`.
- **Verification via `git check-ignore -v`:**
  - `.dev.vars` → matched line 41 (`.gitignore:41:.dev.vars`)
  - `workers/images/.dev.vars` → matched line 42 (`.gitignore:42:workers/images/.dev.vars`)
  - `.env` → matched line 25 (`.gitignore:25:.env`)
  - `.env.local` → matched line 13 (`.gitignore:13:*.local`)
- **Credential tracking audit (`git ls-files`):** Confirmed zero credentials or `.dev.vars` files are tracked in Git. Only template files (`.example`) are tracked.
- **Frontend variables audit:** Verified `src/` contains zero private secrets. Only safe public client variables (`VITE_IMAGES_WORKER_URL`, `VITE_IMAGES_ENABLED`) are read by [imageService.js](../../../src/utils/imageService.js).
- **Working tree preservation:** Uncommitted changes in `tests/regression/phase5-regression.test.mjs` remain strictly preserved.

---

## 2. Corrected IAM Permission Matrix & Custom Role Verification

Every outbound call in [metadata.js](../../../workers/images/src/metadata.js) mapped to exact Google Cloud IAM permissions and verified against Google Cloud IAM testable permissions:

| API Call & Method (`metadata.js`) | Exact Google Cloud IAM Permission | Custom Role Support Level | Status / Notes |
|---|---|---|---|
| `POST https://oauth2.googleapis.com/token` (line 37) | None | N/A | Authenticated via self-signed Service Account RS256 JWT assertion |
| `POST .../accounts:lookup` (line 92) | `firebaseauth.users.get` | **SUPPORTED** | Included in `roles/firebaseauth.viewer` |
| `GET .../documents/{path}` (lines 49, 70, 88, 96) | `datastore.entities.get`, `datastore.entities.list` | **SUPPORTED** | Document reads and path collection pagination |
| `POST .../documents:beginTransaction` (line 54) | `datastore.databases.get` | **SUPPORTED** | Required by Firestore to start transactions |
| `POST .../documents:batchGet` (line 48) | `datastore.entities.get` | **SUPPORTED** | Transactional document fetch |
| `POST .../documents:commit` (line 57) | `datastore.entities.create`, `datastore.entities.update` | **SUPPORTED** | Upsert writes without precondition |
| `POST .../documents:rollback` (line 59) | `datastore.databases.get` | **SUPPORTED** | Required by Firestore to roll back transactions |
| `POST .../documents:runQuery` (line 80) | `datastore.entities.get`, `datastore.entities.list` | **SUPPORTED** | Query on `feedbacks` (`where userId == owner`) |

**Delete Verification:** `metadata.js` emits zero `{ delete: ... }` operations (`cleanup()` performs a soft-delete update with `state: 'deleted'`). Therefore, **`datastore.entities.delete` is NOT required and NOT included**.

### Prepared Project-Level Custom Role Definitions

#### Role 1: Firestore Metadata Access
- **ID:** `zerocoderImageMetadataWorker`
- **Title:** ZeroCoder Image Metadata Worker (Firestore)
- **Description:** Least-privilege transactional metadata reads and upserts for ZeroCoder images.
- **Stage:** `GA`
- **Permissions (5):**
  - `datastore.databases.get`
  - `datastore.entities.get`
  - `datastore.entities.list`
  - `datastore.entities.create`
  - `datastore.entities.update`

#### Role 2: Firebase Auth Read-Only Access
- **ID:** `zerocoderAuthLookupWorker`
- **Title:** ZeroCoder Auth Lookup Worker (Identity Toolkit)
- **Description:** Read-only user account status and custom attribute lookup for ZeroCoder image authorization.
- **Stage:** `GA`
- **Permissions (1):**
  - `firebaseauth.users.get`

*(Note: Predefined fallback if Custom Roles are omitted: `roles/datastore.user` + `roles/firebaseauth.viewer`.)*

---

## 3. Staging Architecture Preparation (Design A — Complete Isolation)

Design A achieves **100% isolation** between staging and production environments:

```
[Staging Frontend: localhost:5173 / staging.zerocoder.pages.dev]
      │
      ▼ (Firebase ID Token)
[Staging Worker: zerocoder-images-staging.workers.dev]
      ├── Service Account: sa-staging@zerocoder-staging.iam.gserviceaccount.com
      ├── Firestore / Auth: zerocoder-staging (Isolated Spark project)
      │     └── Isolated: image_budgets/global, image_quotas, feedbacks, users
      └── R2 Bucket: zerocoder-images-staging (APAC, Standard, Private)
```

- **Production safety:** Zero writes or quota consumption on production project `zerocoder-8cb6b` or bucket `zerocoder-images-private`.
- **Accidental overwrite prevention:** Distinct project IDs (`zerocoder-staging` vs `zerocoder-8cb6b`), distinct bucket names (`zerocoder-images-staging` vs `zerocoder-images-private`), distinct worker names (`zerocoder-images-staging` vs `zerocoder-images-worker`), and distinct `ALLOWED_ORIGINS`.

---

## 4. Configuration Templates & Checklist

Templates created:
- Staging Worker config template: [wrangler.staging.jsonc.example](../../../workers/images/wrangler.staging.jsonc.example)
- Production Worker config template: [wrangler.jsonc.example](../../../workers/images/wrangler.jsonc.example)
- Staging secret template: [workers/images/.env.staging.example](../../../workers/images/.env.staging.example)
- Production secret template: [workers/images/.env.example](../../../workers/images/.env.example)

### Staging Worker Settings Matrix
- **Worker Name:** `zerocoder-images-staging`
- **R2 Binding:** `PRIVATE_R2` → `zerocoder-images-staging`
- **Vars:**
  - `IMAGES_ENABLED`: `"true"`
  - `FIREBASE_PROJECT_ID`: `"zerocoder-staging"` (or user-chosen staging project ID)
  - `ALLOWED_ORIGINS`: `"http://localhost:5173,https://staging.zerocoder.pages.dev"`
- **Secrets (Upload via `wrangler secret put <NAME> --config wrangler.staging.jsonc`):**
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

---

## 5. Staging Resource Creation & Deployment Checklist (Awaiting Approval)

Once approved by the owner:

1. **Step 1: Create Staging Firebase Project (Owner action)**
   - Create Firebase project (e.g., `zerocoder-staging`) on Spark plan.
   - Enable Authentication (Email/Password) and Cloud Firestore in `(default)` location.
   - Deploy project Firestore rules ([firestore.rules](../../../firestore.rules)).
2. **Step 2: Create Staging R2 Bucket (Wrangler action)**
   - `npx wrangler r2 bucket create zerocoder-images-staging --location apac`
   - Verify public `r2.dev` access and custom domains remain disabled.
3. **Step 3: Create Custom Roles & Service Account in Staging Project**
   - Create Custom Roles `zerocoderImageMetadataWorker` (5 permissions) and `zerocoderAuthLookupWorker` (1 permission) in the staging project.
   - Create Service Account `zerocoder-images-staging@<project-id>.iam.gserviceaccount.com`.
   - Bind the two custom roles (or predefined fallback) to the Service Account.
   - Generate local JSON key (kept secure and never committed).
4. **Step 4: Configure Staging Worker & Secrets**
   - Copy `workers/images/wrangler.staging.jsonc.example` to `workers/images/wrangler.staging.jsonc`.
   - Run `npx wrangler secret put FIREBASE_CLIENT_EMAIL --config wrangler.staging.jsonc`.
   - Run `npx wrangler secret put FIREBASE_PRIVATE_KEY --config wrangler.staging.jsonc`.
5. **Step 5: Deploy & Smoke-Test Staging Worker**
   - Deploy: `npx wrangler deploy --config wrangler.staging.jsonc`.
   - Smoke tests using a dedicated staging test user:
     - `PUT /v1/images/{sha256}`: upload image with valid token and context; verify 201 response, R2 object, and Firestore metadata `state: 'ready'`.
     - `GET /v1/images/{sha256}`: download image; verify SHA-256 and byte-equality.
     - Cross-user denial: attempt download/delete with a different user token; verify 403 response.
     - `DELETE /v1/images/{sha256}`: verify soft detach (202) and linked refusal (409).
