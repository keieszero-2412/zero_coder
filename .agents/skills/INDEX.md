# ZeroCoder skill and rule index

Read [AGENTS.md](../../AGENTS.md) first. This index selects workflows; it does not
duplicate their instructions. Choose only skills relevant to the current task.

## Installed locations

- GitNexus canonical project skills: this directory. Existing Claude skill paths
  are compatibility redirects to these files, not independent copies.
- Global skills: use the host's discovered catalog first. On this workstation the
  verified root is `C:/Users/zero/.agents/skills/`; open `<root>/<directory>/SKILL.md`.
  In another environment discover installed equivalents; never silently reinstall.
- Detailed custom project context: [zerocoder-rules.md](../rules/zerocoder-rules.md).
- Sequential phase contract: [phase-execution.md](../rules/phase-execution.md).
- Task gates and conflict decisions: [agent-workflow.md](../rules/agent-workflow.md).
- Configuration paths/checks and phase history: [docs/agents/](../../docs/agents/README.md).

## Automatic selection by task

| Trigger | Skill to read | Scope |
|---|---|---|
| Architecture, execution flow, dependencies | [gitnexus-exploring](gitnexus-exploring/SKILL.md) | Graph first, then current source |
| Code edit / blast radius | [gitnexus-impact-analysis](gitnexus-impact-analysis/SKILL.md) | Impact before editing; change analysis before commit |
| Trace a fault through callers | [gitnexus-debugging](gitnexus-debugging/SKILL.md) | Use with systematic debugging |
| Rename, extract, move code | [gitnexus-refactoring](gitnexus-refactoring/SKILL.md) | Graph-aware refactoring |
| Index / CLI operation | [gitnexus-cli](gitnexus-cli/SKILL.md) | Existing runner, index-only refresh |
| GitNexus usage/schema question | [gitnexus-guide](gitnexus-guide/SKILL.md) | Tool guidance only when needed |
| New session / skill selection | Global `using-superpowers` | Select applicable skills, not every workflow |
| New behavior with unsettled design | Global `brainstorming` | Respect explicit direct-execution instruction |
| Multi-step implementation specification | Global `writing-plans`, then `executing-plans` | Plan only the current phase; record later boundaries, do not implement them |
| Feature or bugfix | Global `test-driven-development` | Meaningful failing regression, fix, pass |
| Failure or unexpected result | Global `systematic-debugging` | Reproduce and establish cause before fixing |
| Before completion/checkpoint claims | Global `verification-before-completion` | Fresh evidence and explicit environment |
| Major change review | Global `requesting-code-review` | Current phase only; use independent review when available |
| UI/UX, a11y, responsiveness, theme change | Global `impeccable` | Relevant command/reference; preserve six themes and existing design |
| Coding / implementation choice | Global `ponytail` | Smallest complete change, no unnecessary dependencies |
| Final review of a patch | Global `ponytail-review` | Correctness, security, scope, verification |
| Explicit whole-repository audit | Global `ponytail-audit` | Read-only unless fixes are requested |

## Efficient use

Do not rerun full audits or reread unchanged guidance after each step. Load a
new detailed instruction only when selected by the task, absent from context,
changed on disk, or needed to resolve a concrete conflict. The external
`D:/PROJECT/Agent instructions` documents are source references already consulted;
routine sessions recover from this index instead. Record missing skills/commands
and unverified capabilities, rather than assuming they worked.
