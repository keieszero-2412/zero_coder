# ZeroCoder sequential phase ledger

## Current instructions

- Entry point: [AGENTS.md](../../AGENTS.md).
- Execution contract: [phase-execution.md](../../.agents/rules/phase-execution.md).
- Architecture: Firebase Authentication, Spark and Firestore for structured data;
  Cloudflare R2 for persistent user images. No Firebase Cloud Storage, Blaze, or
  additional databases. Original image bytes and existing user data must survive.
- Phase 1–6 definitions: **awaiting the user's plan or its path**. Do not infer
  six phase boundaries from the former five-phase Firebase Storage conversation.

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

Phase 1 remains unstarted. The user's Phase 1–6 definitions are still required.
