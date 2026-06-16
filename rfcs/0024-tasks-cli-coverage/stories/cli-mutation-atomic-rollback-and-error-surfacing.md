---
title: "Mutation commands must be atomic (rollback partial write) and surface errors, not leave a blocked dirty checkout"
status: ready
updated: 2026-06-16
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Mutation commands (`new`, `new-rfc`, `block`, `status-set`, …) perform
write-file → commit → push as separate, non-atomic steps. When a step crashes
after the file is written but before the commit completes, the checkout is left
**dirty with staged/untracked changes**, and every subsequent command aborts
with `error: <dir> has uncommitted changes; commit or stash them before
mutating`. The agent is then forced into manual `git` plumbing
(`add -A && commit && push HEAD:main`) that trips the _other_ guard
(`HEAD is N commit(s) ahead of origin/main`), producing a catch-22.

Observed this session: `pnpm tasks new 0000-schema-cache-always-warm-convergence
r1-… --body-file …` wrote the story file, then exited 1 with a bare
`Node.js v24.16.0` line and **no stack trace** — the underlying error was
swallowed. The file existed but uncommitted; the next `new` aborted on the
uncommitted-changes guard. Recovery required hand-committing + pushing the
partial work, then a rebase, which (combined with a concurrent auto-finalize —
see sibling story) left a duplicate RFC dir to clean up.

Two defects compound here:

1. **Non-atomic mutation.** A crash mid-mutation leaves the checkout in a state
   that blocks the CLI. Mutations should be transactional: on failure, roll back
   the file write (or complete the commit), so the checkout is never left dirty
   by the CLI's own partial work.
2. **Swallowed error / no diagnostics.** The crash surfaced only as
   `Node.js v24.16.0` + exit 1. The real exception (and stack) must be printed so
   the failure is diagnosable rather than mysterious.

## Acceptance criteria

- [ ] A mutation command that throws partway leaves the checkout **clean** (no
      stray staged/untracked files from that command) — either by completing the
      commit or rolling back the file write — so the next command is not blocked
      by the uncommitted-changes guard.
- [ ] On any mutation failure, the CLI prints the underlying error message and
      stack (or a clear, specific message), never a bare `Node.js <version>` +
      exit 1.
- [ ] A test simulates a failure injected between write and commit and asserts
      the working tree is restored to its pre-command state (clean).
- [ ] The happy path (write → commit → push) is unchanged.

## Notes

- Pairs with `auto-finalize-rebase-duplicate-rfc-dir` (the duplicate-dir cleanup
  this session's recovery triggered). Filing both from the
  0031-schema-cache-always-warm-convergence authoring session.
- No `node:*` imports / no `process.*` beyond what the CLI already uses; this is
  CLI-internal (scripts/tasks), not runtime package code.
