---
title: "port-remaining-middleware-test-remainders"
status: draft
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
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

Split from `port-small-middleware-test-remainders`, whose PR landed
`server_timing_test.rb`, `middleware_stack_test.rb`, `assume_ssl_test.rb` and
`callbacks_test.rb` at their convention paths, complete. Left, under
`vendor/rails/v8.0.2/actionpack/test/dispatch/`:

- `executor_test.rb:89` `test_callbacks_execute_in_shared_context`, `:132`
  `test_error_reporting_with_show_exception`, `:150`
  `test_handled_error_is_not_reported`. `dispatch/executor.test.ts` drives a
  hand-written `StubExecutor`; Rails uses `Class.new(ActiveSupport::Executor)`
  (`executor_test.rb:226-228`) wrapped in `Rack::Lint` (`:220-223`). Converge
  the stub first, then port the three.
- `ssl_test.rb`: 3 `it.skip` stubs — `StrictTransportSecurityTest` (1) and
  `SecureCookiesTest` (2).
- `host_authorization_test.rb`: 2 skips.
- `debug_locks_test.rb:10` `test_render_threads_status` — depends on
  `debug-locks-reads-dependencies-interlock` (`DebugLocks.interlock` is a
  `CONVERGEABLE` seat in `middleware/debug-locks.ts`).
- `ssl.test.ts:8`, `show-exceptions.test.ts` and `host-authorization.test.ts`
  build their own app; Rails uses `ActionDispatch::IntegrationTest.build_app`
  (`test/abstract_unit.rb:118-176`, trails `test-helpers/abstract-unit.ts`
  `buildApp`). `dispatch/server-timing.test.ts` is the worked example.

## Acceptance criteria

- The executor, ssl and host_authorization tests above are ported; the five
  skip stubs are real tests.
- `debug_locks_test.rb` is ported once its dependency lands (add a `deps` edge).
- The three hand-rolled app builders are replaced by `IntegrationTest.buildApp`.
- `pnpm parity:test --package actiondispatch` reports all four files complete.
