---
title: "Mutator process.exit inside commitAndPush lock leaks the shared tasks lock"
status: in-progress
updated: 2026-06-22
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: 3900
claim: "2026-06-22T17:23:57Z"
assignee: "commitandpush-mutator-exit-leaks-lock"
blocked-by: null
---

## Context

While fixing the reconcile-collision lock leak in
`auto-finalize-rebase-duplicate-rfc-dir` (PR #3489), I found the same
lock-leak class still lives in other mutator paths. `commitAndPush`
(`scripts/tasks/cli.ts`) acquires the shared tasks lock and relies on its
`finally { releaseTasksLock(lock) }` to release it — but `process.exit`
skips `finally` (the contract is spelled out at `cli.ts:809-812`). Any
mutator that calls `process.exit` _after_ the lock is acquired (inside the
pull→mutator→commit→push critical section) leaks the lock until stale-steal.

Known instance: the `finalize` mutator does `process.exit(4)` when the
placeholder dir vanished mid-mutation (concurrent finalize) at the
`finalize()` mutator callback (`scripts/tasks/cli.ts`, the
`error: rfcs/${slug} no longer exists` branch). Audit every mutator callback
passed to `commitAndPush` for the same pattern (e.g. `newStory`, `newRfc`
empty-body/validation refusals that run inside the mutator).

The fix pattern is established: throw instead of `process.exit` so the throw
unwinds through `commitAndPush`'s mutator try/catch (rollback + re-throw) and
the `finally` releases the lock — see `migrateDuplicateRfcDir` and the
`releases the lock when a reconcile collision throws` test in PR #3489.

## Acceptance criteria

- [ ] Audit all `commitAndPush` mutator callbacks for `process.exit` calls
      that run after the lock is acquired.
- [ ] Convert each to throw (or release the lock before exiting) so no
      mutator-internal refusal leaks the shared lock.
- [ ] A regression test per converted path asserts the lock file is removed
      after the refusal (mirror the PR #3489 lock-release test).
