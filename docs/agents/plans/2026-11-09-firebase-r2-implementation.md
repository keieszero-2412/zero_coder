# ZeroCoder Phase 1–6 implementation plan

**Authority:** User's definitive Phase 1–6 specification in this session; supersedes
the earlier Firebase Storage implementation proposal. Phase 0 `f7d05c8` and Phase
0B `763f0c1` are already committed and must not be repeated. Application baseline:
`430e960` (original Notes restored).

**Goal:** Preserve ZeroCoder functionality and original image quality while securing
Firebase access, synchronizing UID-owned structured data through Firestore, and
using private Cloudflare R2 originals behind one authenticated Worker.

**Architecture:** Existing Firebase Authentication; Spark Cloud Firestore is the
only structured application database. Cloudflare R2 is the only persistent cloud
image store. One Worker verifies Firebase ID tokens and mediates private objects.
IndexedDB is an offline cache/pending-operation queue, never the only permanent
store. No Firebase Cloud Storage, Blaze, D1, KV, Durable Objects, Supabase, or
another database. No invented resources or production-success claims.

**Execution:** Use Superpowers executing-plans/TDD/debugging/verification as relevant,
GitNexus graph-first exploration and impact before code edits, Ponytail for narrow
implementation/review, and Impeccable for affected UI only. Follow
[phase-execution.md](../../../.agents/rules/phase-execution.md). Work on exactly one
phase; do not implement later tasks while the current phase is active. Each phase
ends with tests/review, an isolated commit, ledger update and delivered report
before beginning the next independent phase. No duplicate instruction inventories.

## Phase 1 — Database and storage audit

Scope: read-only current-source and authorized deployed-service inspection.

- [x] Inventory Firebase services, deployed Firestore collections/configuration and
  rules where access permits; distinguish deployed facts from code-only schemas.
- [x] Trace Authentication, trusted-admin weaknesses and every baseline Access Code,
  including Gray, approval/grant/revocation and feature gates.
- [x] Trace all image upload/paste/storage/retrieval/export paths: Feedback Base64,
  localStorage Notes documents, IndexedDB originals, notebook assets and outputs.
- [x] Determine whether Firebase Storage imports/SDK initialization, upload attempts
  and actual existing objects are active or unused. Never infer a bucket from config.
- [x] Record migration operations, concurrency/account-switch/data-loss risks,
  dependency analysis, architecture diagram and acceptance criteria for later phases.
- [x] Validate documentation evidence and report inaccessible production operations.

Acceptance: complete source-backed inventory and code references; deployed reads
labelled with observation date and access outcome; all unknowns explicit; no code,
production data, cloud configuration or billing modifications. Deliver audit and
diagram under docs/agents/reports. PASS only if required inspection is verified;
otherwise PARTIAL/BLOCKED with completed source findings and external gaps.

## Phase 2 — Security foundation and R2 infrastructure

Scope: security rules, one private R2 Worker, reusable storage client, templates and
local security tests. Application feature integration belongs to Phase 3.

- [ ] Add private Worker endpoints for upload, metadata/retrieval, authenticated
  download and safe deletion, with strict canonical keys and UID ownership.
- [ ] Verify Firebase ID tokens server-side: signature, issuer/audience, expiry,
  subject and trusted custom admin claim. Access Code is not admin identity.
- [ ] Preserve original bytes; SHA-256 integrity; supported MIME/signature/size
  validation; immutable/idempotent object identity; account-bound client operations.
- [ ] Store ownership, relationships, state and references in Firestore only; no
  binary/Base64 fields for new images. Use only R2 objects for persistent bytes.
- [ ] Enforce explicit CORS, security headers, bounded errors/retries, abuse controls
  and upload limits without introducing another database. Document residual limits.
- [ ] Correct Firestore least-privilege rules with Emulator tests for anonymous,
  owner, other user, forged profile role, all Access Codes and trusted admin flows.
- [ ] Remove Firebase Storage code/dependencies only after Phase 1 proves the loss
  risk and a safe replacement/recovery path. Preserve legacy originals and metadata.
- [ ] Provide configuration/secrets templates with no real credentials/resources;
  test Worker storage/auth locally with labelled mocks, not production claims.

Acceptance: meaningful denial/ownership/integrity/retry/deletion tests pass; client
cannot grant itself admin; original-byte hashes match; architecture exclusions
hold; build/lint and Emulator tests pass. Production activation remains BLOCKED
until owner-provisioned resources/secrets and explicit release approval exist.

## Phase 3 — Application integration

- [x] Feedback saves originals through the shared R2 service and only references in
  Firestore; preserve legacy Base64 rendering, admin viewing/replies/notifications.
- [x] Preserve floating/draggable Notes and image paste/upload/preview/edit controls,
  tags and source context. Store structured Notes in UID-owned Firestore documents.
- [x] Add UID synchronization, IndexedDB cache/queue, offline edits/retries,
  revision/conflict protection and strict account switching/isolation.
- [x] Classify other image producers; integrate persistent user uploads, preserving
  bundled static/notebook assets and temporary execution output appropriately.
- [x] Add component/integration tests and browser checks. Production-ready flags
  remain off until actual Firebase/Worker/R2 verification succeeds.

Acceptance: reference-only new image records, original hash preservation, Notes UI
and metadata preserved; offline/reconnect and two-account isolation verified.
Browser/component tests and build/lint pass. Mock/Emulator results are labelled.

## Phase 4 — Legacy data migration

- [x] Feedback Base64 → private R2; Notes IndexedDB originals → R2; localStorage
  structured Notes → Firestore, retaining tags/source/editor relationships.
- [x] Implement dry-run, immutable backup, resumable/idempotent operation identity,
  per-object integrity/reference verification, concurrent-update preconditions,
  retry/recovery and rollback. Preserve legacy source until complete verification.
- [x] Explicit guest adoption only; never import another account's local records.
  Interrupted uploads must leave recoverable originals and a pending operation.
- [x] Test interrupted/repeated/conflicting migration and image-only rollback
  without overwriting later user edits. Document backup and operator procedures.

Acceptance: migration regressions pass locally, repeated runs do not duplicate or
destroy data; rollback validates backups and current references. Actual cloud
migration is BLOCKED until R2 is provisioned and approved; no destructive default.

## Phase 5 — Admin, functionality and regression verification

- [ ] Verify/fix every original Access Code, especially Gray, plus admin approval,
  authorization, grant changes and revocation without weakening trusted-admin rules.
- [ ] Verify security/cross-user isolation; Notes CRUD/sync/editor/tags/context and
  images; Feedback new/legacy images, replies, notifications and concurrency.
- [ ] Export Markdown ZIP with original images; PDF/DOCX preserve quality and
  resolution, Unicode text and explicit missing-asset errors.
- [ ] Verify all six themes, accessibility, responsive layout, original courses,
  client practice/progress, coding tests and navigation; no unrelated redesign.
- [ ] Implement/verify reference-aware image cleanup and recovery, including
  revisions, soft deletes, pending work and concurrency safety.

Acceptance: regression matrix records passed/failed/skipped cases and environment;
required fixes verified through focused tests and browser checks; original bytes,
Access Codes and UI preserved. Distinguish browser practice from trusted assessment.

## Phase 6 — Production readiness and activation

- [ ] Document owner Cloudflare account/private R2 bucket setup, Worker deployment,
  binding names, trusted Firebase service configuration, secrets and frontend vars.
- [ ] Provide actual authenticated upload/download/hash and other-user/admin denial
  verification procedure; Firestore rules/frontend rollout order avoiding lockout.
- [ ] Document production backup, staged migration, recovery, rollback and cleanup.
- [ ] Document usage/cost monitoring and current free-tier considerations using
  current official sources; final architecture and release checklist.
- [ ] Ask for missing Cloudflare configuration when needed. Never request API
  secrets in chat: configure locally or securely through Cloudflare.

Acceptance: locally executable readiness checks and templates are complete; live
operations remain BLOCKED unless explicitly authorized and actually verified.
No production deployment, billing activation, paid provisioning or destructive
migration without explicit authorization. Do not mark incomplete activation PASS.

## Required phase report

Status PASS / PARTIAL / BLOCKED / FAIL; scope and acceptance; changes/affected
files; tests passed, failed and skipped; actual environment; isolated commit hash;
remaining issues; external blockers; next phase. Keep the
[phase ledger](../phase-ledger.md) current. A report in commentary satisfies the
delivery gate, allowing the next authorized independent phase to proceed.
