---
trigger: always_on
description: "Execute one ZeroCoder phase at a time; verify and report it before the next phase."
---

# Strict sequential phase execution

Execute exactly ONE Phase at a time, in order:
**Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6.**

The user's required **Phase 0B configuration cleanup** is an additional gate
after Phase 0 and before Phase 1. Complete, verify, commit and report Phase 0B
under the same contract; it does not renumber or authorize Phase 1–6.

For each Phase:

1. Define its scope and acceptance criteria using the user's approved plan.
2. Implement all locally executable tasks within that Phase.
3. Run relevant tests and fix failures.
4. Review changes and verify every acceptance criterion.
5. Commit only verified changes belonging to that Phase. Preserve unrelated work.
6. Deliver a complete Phase report: status, changes, test results, commit hash,
   blockers, and remaining work. Include deployment status and test environment.
7. **Only after that report is delivered**, proceed automatically to the next
   independent, locally executable Phase. A commentary report can satisfy this
   gate; do not require the user to repeat "continue" when work is authorized.

Never:

- Work on multiple Phases simultaneously, including tests or delegated agents.
- Skip a Phase without reporting why.
- Mix unrelated Phase changes in one commit.
- Start the next Phase before reporting the current one.
- Mark a Phase PASS when required functionality remains unverified.
- Claim mock or Emulator success as production verification.

If external access or configuration is missing, complete all independent tasks in
the current Phase. Mark affected operations **BLOCKED**, report the exact blocker
and remaining work, then continue to the next independent Phase after the report.
Use **PASS** only when required acceptance criteria are verified; otherwise use
**BLOCKED** or **IN PROGRESS**, with verified sub-results stated separately.

If user input is necessary, ask a specific question. Never invent credentials,
resources, authorization, or missing phase definitions. A missing plan blocks its
dependent phases, not independent work already defined by the user.

Keep a short version-controlled phase ledger. Record the plan's path, phase
scope, verification evidence, checkpoints, unresolved gates and instruction
conflict decisions. On interruption, recheck Git HEAD/status before resuming;
conversation claims are not proof that changes exist in the current checkout.
