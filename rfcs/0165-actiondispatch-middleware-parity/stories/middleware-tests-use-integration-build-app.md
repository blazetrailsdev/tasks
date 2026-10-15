---
title: "middleware-tests-use-integration-build-app"
status: draft
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps:
  - debug-locks-reads-dependencies-interlock
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

Split from `port-remaining-middleware-test-remainders`, whose PR ported the
executor, ssl and host_authorization remainders. Left:

- `ssl.test.ts` (`buildApp`, `:8`), `show-exceptions.test.ts` (`buildApp`, `:32`)
  and `host-authorization.test.ts` (`buildApp`, `:285`) build and call their own
  middleware. Rails drives each through `ActionDispatch::IntegrationTest`
  (`vendor/rails/v8.0.2/actionpack/test/dispatch/ssl_test.rb:5-16`,
  `show_exceptions_test.rb`, `host_authorization_test.rb:496-508`) and
  `build_app` (`vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb:118-176`,
  trails `test-helpers/abstract-unit.ts`). `dispatch/server-timing.test.ts` is
  the worked example.
- `debug_locks_test.rb:10` `test_render_threads_status`
  (`vendor/rails/v8.0.2/actionpack/test/dispatch/debug_locks_test.rb`) needs
  `ActiveSupport::Dependencies.interlock` (story
  `debug-locks-reads-dependencies-interlock`).

## Acceptance criteria

- The three hand-rolled builders are replaced by `IntegrationTest` + `buildApp`,
  with `get` / `response` as Rails' tests use them.
- `debug_locks_test.rb` is ported at `dispatch/debug-locks.test.ts`.
- `pnpm parity:test --package actiondispatch` reports both complete.
