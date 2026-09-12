---
title: "Converge IsolatedExecutionState.scope onto Rails' in-place state writes"
status: in-progress
updated: 2026-09-12
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#7726
claim: "2026-09-12T01:50:56Z"
assignee: "isolated-execution-state-scope-has-no-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

`IsolatedExecutionState.scope(key, value, fn)`
(`packages/activesupport/src/isolated-execution-state.ts`) forks the current
store into a new Map, sets one key in it, and runs `fn` with that fork current.
Rails has no such method. `activesupport/lib/active_support/isolated_execution_state.rb`
exposes only `[]`, `[]=`, `key?`, `delete`, `clear`, `context`, `share_with` and
the private `state` (`:30-69`): state is per-thread and mutated in place, so a
Ruby caller writes `IsolatedExecutionState[:key] = value` and restores it itself.

Rails' own callers do exactly that — `active_record/future_result.rb:112` sets
`ActiveSupport::IsolatedExecutionState[:active_record_instrumenter] =
@event_buffer` with no scoping construct at all.

After trails#7722 the fork is also the one place `Scoped.thread` tagging is
needed: `store()` has to compare the scoped fork's thread against
`Thread.current` so a newly spawned Thread does not inherit a caller's fork.
That tagging exists only to support `scope`.

## Converged shape

- Establish, per call site, whether Rails sets the key and restores it, or never
  restores it. Port that.
- Remove `scope` once its callers are converged, and with it the `Scoped`
  wrapper and the thread-tag comparison in `store()`.
- `Thread`-boundary isolation then comes from the per-thread state map alone,
  which is what `isolated_execution_state.rb:67-69` describes.

## Acceptance criteria

- [ ] Each `IsolatedExecutionState.scope` call site is replaced by the
      set/restore its Rails counterpart performs, with the Rails `file:line`
      cited at the site.
- [ ] `scope`, `Scoped` and the thread-tag comparison in `store()` are deleted.
- [ ] Concurrent-context tests stay green: `execution-context.trails.test.ts`
      (activerecord and activesupport) and
      `trailties/src/server/request-thread.trails.test.ts`.
