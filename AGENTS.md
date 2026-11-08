# ZeroCoder agent instructions

This is the authoritative project entry point. Host/system instructions and the
current user's explicit requirements take precedence; never silently overwrite
conflicting instructions. Record the resolution in the active phase report.

- **One phase at a time:** Phase 0 → 1 → 2 → 3 → 4 → 5 → 6. Follow the full
  [execution rule](.agents/rules/phase-execution.md). Report the current phase
  **before** doing any work for the next one. Phase 0B cleanup is required before
  Phase 1. Do not invent missing phase scopes.
- **Architecture:** Firebase Authentication + Spark + Cloud Firestore for structured
  data; Cloudflare R2 for all persistent user images. No Firebase Cloud Storage,
  Blaze, additional databases, or image binaries/Base64 in Firestore. Preserve
  original bytes, UID ownership, legacy data and supported Admin Access Codes.
  A client-editable role or access code never grants trusted administrator status.
- **Preserve work:** inspect Git status/HEAD before changes. Never reset, clean,
  overwrite unrelated edits, or mix phases in a commit. Never invent credentials,
  resources, authorization, or production verification.
- **Select skills by task:** use the [short skill index](.agents/skills/INDEX.md).
  Load only the relevant detailed skill; reuse it within the session unless it
  changes. Do not reinstall or copy globally installed skills into this repository.
- **GitNexus:** bind zero_coder to this checkout. Use graph-first exploration;
  run upstream impact before editing code and warn on HIGH/CRITICAL. UNKNOWN is
  unresolved: confirm actual callers in source. Run detect_changes(scope: all)
  before committing; partial/truncated results require follow-up, never an all-clear.
- Follow [workflow and conflict decisions](.agents/rules/agent-workflow.md).
  Load [custom architecture/UI history](.agents/rules/zerocoder-rules.md) only for
  relevant changes. Preserve six themes, responsive behavior and existing UI.

Do not routinely reread D:/PROJECT/Agent instructions. Consult a source only if
missing context, changed guidance or a concrete unresolved conflict requires it.
Use version-controlled rules and phase reports to recover across sessions.
See [configuration layout and verification](docs/agents/README.md).
