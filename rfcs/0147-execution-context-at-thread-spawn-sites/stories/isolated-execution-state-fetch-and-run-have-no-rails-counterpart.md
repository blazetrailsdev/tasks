---
title: "IsolatedExecutionState.fetch and .run have no Rails counterpart"
status: draft
updated: 2026-09-12
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IsolatedExecutionState` (`packages/activesupport/src/isolated-execution-state.ts`)
carries two members Rails does not have. Rails' class body is
`activesupport/lib/active_support/isolated_execution_state.rb:30-69` — `[]`,
`[]=`, `key?`, `delete`, `clear`, `context`, `share_with`, plus `unique_id` and
`isolation_level=`. There is no `fetch` and no `run`.

- **`fetch(key, init)`** stands in for Ruby's `||=` memo. Every Rails call site
  writes it inline: `ActiveSupport::IsolatedExecutionState[:active_record_connected_to_stack]`
  guarded by an `if/else` (`activerecord/lib/active_record/core.rb:216-224`),
  `ActiveSupport::IsolatedExecutionState[:active_record_suppressor_registry] ||= {}`
  (`suppressor.rb:37`), `ActiveSupport::IsolatedExecutionState[:active_record_explain_registry] ||= new`
  (`explain_registry.rb:17`), `self[:__id__] ||= Object.new`
  (`isolated_execution_state.rb:32-34`). Note `fetch` also differs from `||=`
  for a stored `null`/`false` — it caches an explicit `undefined`, where `||=`
  re-runs the initializer.

- **`run(fn)`** is now literally `new Thread(fn).value()` after trails#7726, so
  it is a one-line alias for the `Thread` seat Rails spawn sites write directly
  (`connection_pool/reaper.rb:41`). trails#7726 already converged the
  production spawn sites onto `new Thread(...)`; what remains is ~25 test call
  sites plus `packages/activesupport/src/isolated-execution-state.test.ts`.

## Converged shape

- Delete `fetch`. Each caller inlines the `||=` its Ruby counterpart writes —
  `has()`/`get()` then `set()`, or `get() ?? set(...)` where Ruby writes `||=`
  and the value cannot be `false`/`nil`. Check each site against its Ruby line
  before picking, because the two differ exactly where Rails relation readers
  depend on the difference.
- Delete `run`. Callers write `new Thread(fn).value()`, the spelling
  trails#7726 put at every production spawn site.

## Acceptance criteria

- [ ] `IsolatedExecutionState.fetch` and `IsolatedExecutionState.run` are gone.
- [ ] Each former `fetch` call site matches the `||=` (or `if/else`) its Rails
      counterpart writes, with the Rails `file:line` verifiable at the site.
- [ ] `pnpm parity:api:extra --package activesupport` shows two fewer extra
      members on `isolated-execution-state.ts`; `parity:api:extra:gate` does not
      rise.
- [ ] `packages/activesupport/src/isolated-execution-state.test.ts`,
      `execution-context.trails.test.ts` and
      `packages/activerecord/src/connection-handling.test.ts` stay green.
