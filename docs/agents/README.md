# Agent configuration

[AGENTS.md](../../AGENTS.md) is the project entry point, not this directory.
Read it once at session initialization; load detailed skills only when triggered.

| Path | Canonical purpose / consumer |
|---|---|
| [AGENTS.md](../../AGENTS.md) | Shared project instructions; Codex and Antigravity entry point |
| [CLAUDE.md](../../CLAUDE.md) | Claude native `@AGENTS.md` import; no independent rules |
| [.agents/rules/](../../.agents/rules) | Shared constraints; valid Antigravity frontmatter and flat discovery paths |
| [.agents/skills/INDEX.md](../../.agents/skills/INDEX.md) | Task triggers, canonical GitNexus skills and installed global skill references |
| [.claude/skills/](../../.claude/skills) | Six thin discovery wrappers pointing to canonical GitNexus skills |
| [.impeccable/config.json](../../.impeccable/config.json) | Tool-required project configuration; local overrides stay ignored |
| [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md) | Root product/design context resolved by installed Impeccable |
| [.impeccable/design.json](../../.impeccable/design.json) | Required extension sidecar; does not replace DESIGN.md token primitives |
| [phase-ledger.md](phase-ledger.md) | Current phase state and unresolved implementation boundaries |
| [reports/](reports) | Dated inventories and verification reports, not additional instruction authorities |
| [check-config.mjs](../../tools/agents/check-config.mjs) | Reproducible structural verification, independent of app builds |

Do not move tool discovery paths merely to make the tree look smaller. Do not add
Windows symlinks, reinstall globally installed skills, copy their implementations,
or move the application source as configuration cleanup. The compatibility wrappers
carry only discovery metadata and a reference, not a second workflow.

Run `node tools/agents/check-config.mjs` for local links, native imports, rule/skill
metadata and Impeccable JSON. Add `--installed` to check this workstation's global
skill references and GitNexus runner; `ZERO_AGENT_SKILLS_ROOT` overrides the global
skill directory on another workstation. This checks structural discovery contracts,
not authenticated host menus, live services, or a new model session.

The one-time inventory and retention decisions are in the
[Phase 0B report](reports/2026-11-09-phase-0b.md). Do not repeat that full inventory
in routine sessions. Read detailed rules once per session unless their content
changes or a concrete missing/conflicting requirement demands reloading.
