---
title: "Retire withExecutionContext into the Thread seat and share_with"
status: in-progress
updated: 2026-09-12
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: trails#7726
claim: "2026-09-12T01:50:56Z"
assignee: "isolated-execution-state-scope-has-no-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

trails#7722 gave ruby-compat a `Thread` seat (`vendor/ruby/thread.c`,
`vendor/ruby/vm.c:4043`) and made `IsolatedExecutionState` key its state on
`Thread.current`, as `activesupport/lib/active_support/isolated_execution_state.rb:55-69`
does: `context` is `scope.current` (`:55-57`) and `state` is
`context.active_support_execution_state ||= {}` (`:67-69`).

That leaves `withExecutionContext`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool/execution-context.ts`)
as a trails-only seam carrying a `@noRailsEquivalent PERMANENT` receipt. Its body
is now a thin wrapper: `IsolatedExecutionState.run` (i.e. `new Thread(fn)`),
`IsolatedExecutionState.shareWith(caller)` — Rails' `share_with`
(`isolated_execution_state.rb:59-64`) — and the `_exitHooks` fan-out, which is
also trails-only.

Rails has no such wrapper. A Rails thread-spawn site is `Thread.new { ... }`
(e.g. `connection_pool/reaper.rb:41`) and nothing else; the lease is reclaimed
because the thread dies, not because a hook runs.

## Converged shape

- Call sites spawn through the `Thread` seat directly, the way Rails writes
  `Thread.new`.
- Where the caller's locals must carry over, call `IsolatedExecutionState.shareWith`
  at the site, as `isolated_execution_state.rb:59-64` does.
- Establish what `_exitHooks` is standing in for and retire it, or reduce it to
  the one thing with a Rails counterpart. `registerContextExitHook`,
  `executionContextId` and `withExecutionContext` all carry
  `@noRailsEquivalent PERMANENT` receipts today; this story is the burndown.

## Acceptance criteria

- [ ] `withExecutionContext` is gone, or its remaining body has a named Rails
      counterpart cited at the declaration.
- [ ] Every spawn site reads as its Rails `Thread.new` counterpart.
- [ ] `pnpm parity:api:extra:gate` does not rise; the activerecord receipts
      retired by this story are deleted, not moved.
