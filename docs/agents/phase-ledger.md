# ZeroCoder sequential phase ledger

## Current instructions

- Entry point: [AGENTS.md](../../AGENTS.md).
- Execution contract: [phase-execution.md](../../.agents/rules/phase-execution.md).
- Architecture: Firebase Authentication, Spark and Firestore for structured data;
  Cloudflare R2 for persistent user images. No Firebase Cloud Storage, Blaze, or
  additional databases. Original image bytes and existing user data must survive.
- Phase 1–6 definitions: the [definitive implementation plan](plans/2026-11-09-firebase-r2-implementation.md),
  supplied by the user after Phase 0B. The former Firebase Storage proposal is superseded.

## Phase 0 — Agent rules and skills synchronization

Status: **PASS for repository configuration**, with downstream plan input pending.

Baseline: `430e960` with a clean worktree. This checkout does not contain the
previous conversation's Firebase implementation commits or saved plan. Do not
claim those changes are present or reapply the superseded Storage architecture.

Scope: repository agent configuration and this ledger only. No application code,
Firebase/R2 data, service resources, billing, or deployment changes.

| Acceptance criterion | Result |
|---|---|
| Concise authoritative project entry point | AGENTS entry point; CLAUDE compatibility pointer |
| Exact sequential phase rule persists | One active phase, explicit criteria, local work/tests/review, phase-only commit, complete report before next phase |
| No false completion/production claims | PASS requires verified criteria; external operations BLOCKED; local/mock/Emulator evidence labelled |
| Task-specific skill routing | Version-controlled index selects GitNexus, Superpowers, Impeccable and Ponytail workflows |
| Preserve customizations and directory layout | Existing custom rules body preserved; six identical Claude skill bodies replaced with redirects; paths/frontmatter retained |
| Installed references and commands | 31 relative links validated across 18 configuration files; 12 referenced global skills found; six canonical redirects validated; existing CLI help and index-only flag verified |
| No routine instruction reload/install | Reuse loaded instructions; external guidance read only for missing/changed/conflicting requirements; no global install or repository copy |

Conflicts resolved explicitly:

- Latest Spark/Firestore/R2 requirement supersedes the former Firebase Storage/
  Blaze design. This phase records the constraint; implementation is not claimed.
- User's direct-execution and sequential phase requirements take precedence over
  generic design-approval, worktree and parallel-execution suggestions.
- Preserve incumbent six-theme UI conventions over generic redesign suggestions.
- GitNexus index-only mode prevents generated entry points/skill copies from
  overwriting this configuration. MCP remains preferred to the installed CLI.

Verification: local reference/preservation assertions passed. GitNexus
`detect_changes(scope: all)` completed with no partial/truncated flag; no indexed
code symbols changed. Configuration Markdown is not fully represented by the
graph, so source diff and link checks supplied the relevant evidence. Whitespace
and staged scope must pass before checkpoint. No application build, Emulator run
or production verification is claimed for this documentation-only phase.

Checkpoint: the commit containing this report. Retrieve with
`git log --follow --format=%h -- docs/agents/phase-ledger.md`.

Historical Phase 0 checkpoint: `f7d05c8`. Phase 0B relocates this ledger;
the command above follows the rename rather than identifying Phase 0 alone.

Remaining work: obtain the actual Phase 1–6 plan, define Phase 1 acceptance criteria,
and implement only Phase 1 after delivering the Phase 0 report. The specific plan
question has been asked; missing phase definitions block dependent implementation.

## Phase 0B — Configuration consolidation

Status: local cleanup VERIFIED; interactive Claude/Antigravity host smoke tests
BLOCKED. No overall PASS or production verification is claimed.

Scope: agent/tool configuration, documentation organization, ignored local state
and a configuration verifier. No application-source or database implementation.

Acceptance: one authoritative entry point, tool-required discovery paths preserved,
working local references and rule/skill metadata, root design context preserved,
safe history retention, phase-only commit, and explicit host-test limitations.

Changes: required Antigravity rule frontmatter, Claude native shared import,
canonical agent documentation under this directory, portable product-document
links, targeted ignore rules, and a dependency-free structural checker. Six Claude
skill wrappers and Impeccable configuration/design sidecar remain at required paths.

See the [Phase 0B report](reports/2026-11-09-phase-0b.md) and its per-item inventory
for evidence, retention decisions and the final layout. The inventory is one-time;
normal sessions use the entry point/index, not a repeated full scan.

Phase 0B checkpoint: `763f0c1`. Phase definitions were subsequently supplied by the
user; the linked definitive plan now resolves that input blocker.

## Phase 1 — Database and storage audit

Status: PASS for read-only audit deliverables; implementation and activation are
not included in this status. Scope and acceptance follow the definitive plan.

Deliverables: the definitive Phase 1–6 plan, source/deployed storage inventory,
four-code access map, dependency analysis, current/target architecture diagrams,
data-loss/concurrency risks and migration acceptance requirements in the
[Phase 1 report](reports/2026-11-09-phase-1-storage-audit.md).

Production read evidence: active Firebase project, billing disabled, one free-tier
Firestore database, eight root collection counts and sampled schemas, deployed
permissive rules, no Storage buckets, Storage API disabled, and 17 Auth accounts
with zero custom-admin claims. GET and read-only query POST only; no data changes.
Actual browser stores and Cloudflare resources were not inspected.

Verification: documentation checker passed (27 Markdown files, 75 local links,
12 skill entries); existing image validation tests passed 2/2. No application
build, Emulator execution, browser workflow or live upload success is claimed.
The checkpoint is the commit containing the Phase 1 report; retrieve its hash with
`git log -1 --format=%h -- docs/agents/reports/2026-11-09-phase-1-storage-audit.md`.

External gates: approved production administrator UID/claim bootstrap, reviewed
historical grants, Cloudflare R2/Worker provisioning and explicit release approval.
Next: Phase 2 local security/R2 foundation, only after the Phase 1 report is delivered.

## Phase 2 — Security foundation and R2 infrastructure

Status: **PASS for local security foundation, Worker infrastructure and emulator-verified rules**.
Live Cloudflare deployment and production Firestore rule updates remain BLOCKED.

Deliverables:
- Deployed configuration: `firestore.rules`, `firestore.indexes.json`, `firebase.json`
- Authenticated Cloudflare Worker: `workers/images/src/firebaseToken.js`, `metadata.js`, `index.js`
- Client utilities: `src/utils/imageOriginal.js`, `imageStorage.js`, `accessPolicy.js`, `authActions.js`
- Configuration templates: `workers/images/wrangler.jsonc.example`, `workers/images/.env.example`
- Test suites: `tests/images/` (14 unit tests), `tests/firebase/` (11 emulator tests)
- Documentation: [Phase 2 report](reports/2026-11-10-phase-2-security-r2.md)

Verification:
- Image storage and token tests: 14/14 passed
- Firebase Auth & Firestore security emulator tests: 11/11 passed
- Offline regression tests: 15/15 passed
- Config link verification: 27 files, 75 links verified (0 errors)
- Linter (`oxlint`) and production build (`vite build`): passed with 0 errors
The checkpoint is the commit containing the Phase 2 report; retrieve its hash with
`git log -1 --format=%h -- docs/agents/reports/2026-11-10-phase-2-security-r2.md`.

External gates:
- Cloudflare R2 bucket and Worker deployment authorization
- Google Cloud IAM service account credentials for production Firestore metadata
Next: Phase 3 application integration.

## Phase 3 — Application integration

Status: **PASS for local application integration, Notes Firestore synchronization, and dual legacy/R2 image support**.
Live Cloudflare deployment and R2 bucket provisioning remain BLOCKED.

Deliverables:
- Notes Firestore synchronization: `src/utils/notesStorage.js`, updated `src/pages/Notes.jsx`
- Feedback R2 integration: `src/components/FeedbackWidget.jsx`, `src/components/AdminPanel.jsx`
- Shared image service & cache: `src/utils/imageService.js`, updated `src/utils/notesImages.js`
- Firebase Storage removal: removed from `src/config/firebase.js` and `src/utils/notesImages.js`
- Phase 2 hardening: server-side UID & traversal checks in `workers/images/src/metadata.js`
- Test suites: `tests/integration/phase3-app.test.mjs` (7 tests), `tests/images/metadata.test.mjs` (regression)
- Documentation: [Phase 3 report](reports/2026-11-10-phase-3-application-integration.md)

Verification:
- App integration tests: 7/7 passed
- Image storage and token tests: 15/15 passed
- Offline regression tests: 15/15 passed
- Config link verification: 28 files, 77 links verified (0 errors)
- Linter (`oxlint`) and production build (`vite build`): passed with 0 errors
The checkpoint is the commit containing the Phase 3 report; retrieve its hash with
`git log -1 --format=%h -- docs/agents/reports/2026-11-10-phase-3-application-integration.md`.

External gates:
- Cloudflare R2 bucket and Worker deployment authorization
- Google Cloud IAM service account credentials for production Firestore metadata
Next: Phase 4 legacy data migration.

## Phase 4 — Legacy data migration

Status: **PASS for local migration tooling, durable backups, dry-run, idempotency, transactional/revision conflict protection, and rollback tests**.
Actual production data migration remains BLOCKED pending Cloudflare R2 provisioning and owner authorization.

Deliverables:
- Data URL parser & magic-byte validator: `src/utils/migration/dataUrl.js`
- Idempotent, resumable migration engine, durable backups & rollback: `src/utils/migration/legacyMigration.js`
- Transactional Firestore migration adapter: `src/utils/migration/firestoreAdapter.js`
- Migration regression test suite: `tests/migration/phase4-migration.test.mjs` (9 tests)
- Documentation: [Phase 4 report](reports/2026-11-12-phase-4-migration.md)

Verification:
- Migration regression tests: 9/9 passed
- App integration tests: 7/7 passed
- Image storage and token tests: 15/15 passed
- Offline regression tests: 15/15 passed
- Config link verification: 30 files, 81 links verified (0 errors)
- Linter (`oxlint`) and production build (`vite build`): passed with 0 errors
The checkpoint is the commit containing the Phase 4 report; retrieve its hash with
`git log -1 --format=%h -- docs/agents/reports/2026-11-12-phase-4-migration.md`.

External gates:
- Cloudflare R2 bucket and Worker deployment authorization
- Explicit owner authorization to execute production migration
Next: Phase 5 admin, functionality and regression verification.

## Phase 5 — Admin, functionality and regression verification (IN PROGRESS — local PASS; live cloud BLOCKED)

- **Scope:** Verify and fix all four Access Codes (`Green`, `Blue`, `Gray`, `Red`), admin approval, grant changes, revocation, cross-user isolation, Notes/Feedback functionality, exports (Markdown ZIP, PDF, DOCX), six themes, responsive UI, and reference-aware image cleanup.
- **Key changes:**
  - `src/components/AdminPanel.jsx`: Updated `handleApprove` and `handleChangeUserCode` to sync `user_access/{uid}` alongside `authorized_emails` and `users`; updated `toggleBypass` to write both canonical `settings/auth` (`schemaVersion: 2`) and legacy `authorized_emails/bypass@zerocoder.admin`.
  - `src/utils/notesExport.js` & `src/pages/Notes.jsx`: Passed `note.ownerUid` to `getNoteImage(id, note.ownerUid)` in `exportMarkdown`, `makeImagePdf`, and `exportDocx`.
  - `tests/regression/phase5-regression.test.mjs`: Added 4 regression tests covering the Access Code matrix, reference-aware cleanup lifecycle, export/asset ID validation, six-theme preservation, and `firebase/storage` removal.
- **Verification:**
  - `node --test tests/images/*.test.mjs tests/integration/*.test.mjs tests/migration/*.test.mjs tests/regression/*.test.mjs`: **35/35 pass** (0 fail, 0 skipped).
  - `npm run test:offline`: **15/15 pass** (0 fail, 0 skipped).
  - `node tools/agents/check-config.mjs`: **0 errors** (30 markdown files, 81 local links, 12 skill entries).
  - `npm run lint`: **0 errors** (109 pre-existing warnings).
  - `npm run build`: **PASS** (2216 modules transformed, built in 6.57s).
- **Report:** [2026-11-12-phase-5-regression.md](reports/2026-11-12-phase-5-regression.md)
- **External gates:**
  - Cloudflare R2 bucket and Worker deployment authorization
  - Live Firebase Authentication / Firestore production verification
Next: Awaiting explicit user instruction before Phase 6 (Production Readiness).



