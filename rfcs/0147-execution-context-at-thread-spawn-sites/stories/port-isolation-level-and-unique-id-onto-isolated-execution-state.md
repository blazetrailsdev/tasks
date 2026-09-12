---
title: "Port isolation_level, scope and unique_id onto IsolatedExecutionState"
status: draft
updated: 2026-09-12
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IsolatedExecutionState` (`packages/activesupport/src/isolated-execution-state.ts`)
is missing the whole isolation-level half of
`activesupport/lib/active_support/isolated_execution_state.rb:5-34`:

- `Thread.attr_accessor :active_support_execution_state` and the `Fiber` twin
  (`:7-8`).
- `attr_reader :isolation_level, :scope` (`:11`).
- `isolation_level=(level)` (`:13-27`) — validates `%i(thread fiber)`, raises
  an `ArgumentError` whose message names the two legal levels and inspects the
  rejected one, calls `clear` when an old level was set, and assigns `@scope` to `Thread` or
  `Fiber`.
- `unique_id` (`:30-34`) — `self[:__id__] ||= Object.new`.
- `self.isolation_level = :thread` at the bottom of the module (`:73`).

trails hard-codes the `:thread` arm: `context()` returns `Thread.current()`
with no `scope` reader behind it (trails#7726 converged it that far), and
`store()` keys a module-level `WeakMap<Thread, Store>` rather than reading a
`Thread` attribute. That is sound for `:thread` but leaves `isolation_level`,
`scope`, `unique_id` and the `:fiber` arm unported, so a Rails dev reading the
file finds a class with no isolation level at all.

## Converged shape

- Port `isolation_level` / `isolation_level=` / `scope` with Rails' validation
  and error message, and the `clear` on change (`:19`).
- `context()` becomes `scope.current` (`:55-57`) rather than a direct
  `Thread.current()`, so the reader goes through the seat Rails reads.
- Port `unique_id` (`:30-34`).
- The `:fiber` arm needs a `Fiber` seat in ruby-compat; if one does not exist,
  scope this story to the `:thread` arm plus the level validation and file the
  `Fiber` seat separately rather than inventing a stub.

## Acceptance criteria

- [ ] `isolationLevel`, `setIsolationLevel` (the settled spelling for an
      async-free Ruby `x=` is a plain accessor pair — check the file), `scope`
      and `uniqueId` exist with Rails' bodies and Rails' `ArgumentError`
      message verbatim.
- [ ] `context()` reads `scope.current`, not `Thread.current()` directly.
- [ ] `pnpm parity:api --package activesupport` coverage for
      `isolated_execution_state.rb` rises; `parity:api:extra:gate` does not.
- [ ] Rails' own cases port or are enrolled: `#[] when isolation level is
:fiber`, `#[] when isolation level is :thread` and `changing the
isolation level clear the old store` are `it.skip` stubs in
      `packages/activesupport/src/isolated-execution-state.test.ts` today.
