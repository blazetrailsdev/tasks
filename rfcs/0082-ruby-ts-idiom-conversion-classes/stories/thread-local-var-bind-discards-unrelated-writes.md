---
title: "thread-local-var-bind-discards-unrelated-writes"
status: draft
updated: 2026-09-02
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Concurrent::ThreadLocalVar#bind` is save-set-yield-restore: it restores only
the bound variable, so any OTHER thread-local written inside the block is a real
mutation of that thread's storage and persists after `bind` returns. Rails
relies on the primitive for `Deprecation`'s `@explicitly_allowed_warnings` and
`@silence_counter` (`activesupport/lib/active_support/deprecation.rb:77-78`,
used at `deprecation/reporting.rb:93`).

trails' port (`packages/activesupport/src/thread-local-var.ts`) implements
`bind` as `IsolatedExecutionState.scope(this, value, block)`, which forks a
snapshot of the whole store (`new Map(store())`), runs the block inside it, and
discards the fork on return. So a write to an unrelated key inside the block is
silently lost, where Ruby would keep it.

Surfaced in review of PR #7392.

The obvious remedy — mutate-and-restore, mirroring Ruby literally — is wrong
here, and the reason should not be re-derived: `IsolatedExecutionState` falls
back to a process-global `Map` when no scope is open
(`isolated-execution-state.ts`'s `store()` is `ctx().getStore() ?? _fallback`),
so a mutating `bind` at module top level or in a plain sync call writes to
shared state that a concurrent task reads across an `await`. That is exactly the
bug `ThreadLocalVar` was introduced to fix, and it has a regression test
(`deprecation.trails.test.ts`). The fork is what supplies the isolation Ruby
gets from thread-locality.

Note `IsolatedExecutionState.scope` has two other callers already —
`actionpack/src/action-dispatch/middleware/server-timing.ts:34` and
`activerecord/src/core.ts:380` — so changing its semantics is not local to
`ThreadLocalVar`.

## Converged shape

`bind` keeps a scope's isolation but restores only the bound key, so unrelated
writes inside the block survive. Likely shape: run in a forked scope as now, and
on return merge the fork's non-bound entries back into the outer store,
restoring only this variable's previous value. Whether the merge is safe under
concurrency is the actual design question — Ruby has no equivalent hazard
because each thread owns its storage outright.

Do NOT converge by making `bind` mutate the shared fallback store.

## Acceptance criteria

- [ ] A thread-local written inside a `bind` block is still readable after the
      block returns, while the bound variable is restored.
- [ ] The `deprecation.trails.test.ts` concurrency regression still passes: a
      warning outside the block raises while a concurrent task sits inside
      `allow`.
- [ ] A test covers the unrelated-write case directly, and fails on today's
      fork-and-discard.
- [ ] `server-timing.ts` and `core.ts`'s `scope` callers are unaffected, or
      moved deliberately with their own reasoning.
