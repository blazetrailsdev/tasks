---
title: "activerecord: pinConnectionBang takes a required lock_thread that admits a thread, as pin_connection! does"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ConnectionPool#pin_connection!(lock_thread)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:319`)
takes one required parameter and only tests it for truthiness (`:332`,
`@pinned_connection.lock_thread = ActiveSupport::IsolatedExecutionState.context if lock_thread`).
Callers pass a boolean (`test_fixtures.rb`) or a thread
(`activerecord/test/cases/connection_management_test.rb:54`, `pin_connection!(Thread.current)`).

trails declares `async pinConnectionBang(lockThread = false)`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:321`). Two deviations:

- The `= false` default is not in Rails, so a bare `pool.pinConnectionBang()` type-checks where
  Rails raises `ArgumentError`. Some trails tests call it bare.
- The inferred `boolean` type rejects the thread Rails' own test passes. The port of
  `connection_management_test.rb:53-64` passes `true` instead (trails#8808 review, item N1).

## Acceptance criteria

- [ ] `pinConnectionBang` takes a required `lockThread` whose type admits what Rails' callers pass
      (a boolean, or the execution context `IsolatedExecutionState.context()` answers), with no
      default; the body is unchanged.
- [ ] Every bare `pinConnectionBang()` call site passes the argument its Rails counterpart passes.
- [ ] "connections are cleared even if inside a non-joinable transaction" in
      `packages/activerecord/src/connection-management.test.ts` passes `Thread.current()`, as
      `connection_management_test.rb:54` does.
- [ ] `pnpm parity:api:params` and `pnpm parity:api:calls:args` stay green.
