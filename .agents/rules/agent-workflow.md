---
trigger: model_decision
description: "Use when planning, implementing, debugging, reviewing, or verifying a ZeroCoder change, or resolving instruction conflicts."
---

# Task workflow and instruction decisions

## Loading and conflicts

- Start from [AGENTS.md](../../AGENTS.md) and the [skill index](../skills/INDEX.md).
  Select the smallest relevant workflow; do not load every skill for every task.
- Reuse instructions already loaded in this session. In a new session, recover
  from these files and the phase ledger, then read a detailed skill only when needed.
- The current user's Spark/Firestore/R2 requirement supersedes the former Firebase
  Storage/Blaze design. Prior implementation or reports do not authorize restoring
  that design. Do not enable paid services or create resources without authorization.
- Explicit direct implementation requests do not need a repeated design-approval
  loop. Skills do not override user scope, phase order, preservation requirements
  or host permissions. Explain any real conflict and its resolution.
- Preserve existing project conventions. The detailed UI history is scoped context,
  not a reason to rescan unrelated features. Check the affected known regressions.
  Existing themes/visual design take precedence over a generic redesign suggestion.
- Do not create new worktrees, switch branches or move the workspace merely because
  a generic skill recommends isolation. Respect the user's current checkout.

## GitNexus

- Prefer the available GitNexus MCP tools; bind the repo `zero_coder` to the actual
  checkout and state index freshness. Use query for concepts, context for symbols,
  impact for upstream dependencies. Inspect direct callers and execution flows.
- Run impact before code edits; warn on HIGH/CRITICAL `risk`. Never use
  `riskSharedAxes` to waive that warning. UNKNOWN/empty results need source and
  import/caller checks, especially when the index is stale or dispatch is dynamic.
- Run `detect_changes(scope: all)` before each commit. Re-run partial/truncated
  checks or resolve/report the boundary. Zero unseen symbols is not proof of safety.
  Keep unrelated hunks out of the commit even when they appear in graph results.
- Use graph-aware rename. Do not use blind replacement to rename code symbols.
- Installed Windows CLI fallback, from the project root:

  ```powershell
  node C:/Users/zero/GitNexusIndexes/ZEROCODER-e5d1603dc0bc/run.cjs impact "symbolName" --direction upstream --repo .
  node C:/Users/zero/GitNexusIndexes/ZEROCODER-e5d1603dc0bc/run.cjs detect-changes --scope all --repo .
  node C:/Users/zero/GitNexusIndexes/ZEROCODER-e5d1603dc0bc/run.cjs analyze --index-only
  ```

- Use index-only refresh to preserve project instructions and installed skills.
  Refresh writes the index: do not run it in a read-only audit without authorization.
  Do not reinstall/update GitNexus or generate replacement entry points. If the
  installed runner is unavailable, discover existing tools and report the gap.
  Security taint `explain` requires a PDG index; its absence is not a clean audit.

## Implementation and verification

- Use Superpowers for the relevant planning, TDD, debugging, execution and
  verification steps. Carry out one phase's tasks and review before reporting it.
- Use Ponytail to choose the smallest complete fix, preserve validation/security,
  review scope and state limitations. Do not run a whole-repo audit for a small fix.
- Use Impeccable for affected UI/UX, accessibility, themes, responsive behavior and
  design consistency. Load its context once per session; rerun only when it changes.
  Keep backend-only phases free of unrelated UI scans.
- Run relevant regression tests, build/lint for code changes, Emulator security
  tests for Firebase rules/auth, and targeted UI checks for visible changes.
  For documentation-only phases, validate references and preservation instead of
  running unrelated application builds. Record commands, outcomes and limitations.
- Tests use fixtures and local/demo services. Never write live data through tests.
  Emulator/mock/local R2 results must be labelled; they do not verify production.
- Stop only dependent privileged operations. Report missing account/resource/
  deployment approval; continue independent work within the sequential phase rule.
