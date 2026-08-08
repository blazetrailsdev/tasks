---
title: "assertCleanWorktree runs outside the lock, so a concurrent mutation's staged file fails the next caller"
status: done
updated: 2026-08-08
rfc: "0024-tasks-cli-coverage"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6254
claim: "2026-08-08T18:11:46Z"
assignee: "clean-worktree-guard-races-concurrent-lock-holder"
blocked-by: null
closed-reason: null
---

## Context

`commitAndPush` runs its dirty-tree guard **outside** the shared lock
(`scripts/tasks/cli.ts:1183-1197`):

```ts
restoreGeneratedFiles(cwd);
assertCleanWorktree(cwd); // ← outside
const lock = acquireTasksLock(cwd); // ← lock taken after
```

The ordering is deliberate — the comment reasons that `assertCleanWorktree` may
`process.exit`, which skips the lock's `finally`, so keeping it outside means a
refusal cannot leak the shared lock.

But every mutation runs against the **same canonical checkout** (`TASKS_DIR`),
and `flip` stages a story with `git add` before committing it. So while agent A
holds the lock mid-mutation, its staged file is visible in the shared tree.
Agent B — still waiting outside the lock — runs `assertCleanWorktree`, sees A's
transient staged file, and exits 1 with a message that blames the operator for
hand edits they never made:

```text
error: /home/dean/github/blazetrailsdev/tasks has uncommitted changes; commit or stash them before mutating:
  M  rfcs/0051-.../cli-all-flag-reads-raw-configurations-not-configs-for.md
```

Observed 2026-08-07: a `tasks done ... --pr 6188` failed exactly this way while a
concurrent `tasks done` for `cli-all-flag-reads-raw-configurations-not-configs-for`
(#6173) was mid-`flip`. The failure is silent and lossy — nothing retries, so the
story stays `in-progress` forever. Seven stories across three already-merged PRs
(6173, 6188, 6192) were stranded this way and had to be closed by hand. The
pattern is visible in the wreckage: each was a **bundle** PR where some member
ids closed and the rest did not, i.e. the race landed mid-bundle.

The stated objection to moving the check is already solved for the other exit
paths in the same function — they release explicitly, and `releaseTasksLock` is
idempotent (`cli.ts:1224, 1313, 1329, 1339, 1345`).

## Converged shape

Move `assertCleanWorktree(cwd)` inside the critical section, immediately after
`acquireTasksLock`, and release the lock on its refusal path the way every other
`process.exit` in the function already does. A holder's staged files are then
never observable by a waiter, so the guard sees only genuine operator edits —
which is the case it exists for.

`restoreGeneratedFiles(cwd)` may stay outside (it touches only generated
artifacts and is idempotent), or move in alongside; either is fine as long as
the dirty check itself is serialized.

## Acceptance criteria

- [ ] `assertCleanWorktree` runs while the lock is held; a concurrent mutation
      that is mid-`flip` can no longer make another invocation exit 1.
- [ ] The refusal path releases the lock (no leak, no `LOCK_TIMEOUT_EXIT` for
      the next caller).
- [ ] A genuine operator hand-edit is still refused, with the same message and
      exit code as today.
- [ ] Regression test: with a lock held and a story file staged-but-uncommitted,
      a second mutation blocks on the lock rather than failing the dirty check.

## Definition of done

Two `pnpm tasks` mutations racing the same canonical checkout both succeed;
neither reports uncommitted changes that belong to the other.

## Verification

`pnpm vitest run scripts/tasks/cli.test.ts`, plus a manual race: hold the lock
with a slow mutation and run a second `tasks done` against the same `TASKS_DIR`.
