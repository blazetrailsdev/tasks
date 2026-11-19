---
title: "turbo-system-tests-broadcasts"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10377
claim: "2026-11-19T20:29:37Z"
assignee: "turbo-system-tests-broadcasts"
blocked-by: null
closed-reason: null
---

## Context

`turbo-system-tests-action-cable` landed the system-test server's websocket upgrade
(`packages/actionpack/lib/action-dispatch/system-testing/server.ts`) and ported
`vendor/turbo-rails/v2.0.23/test/system/assertions_test.rb` as
`packages/turbo/test/system/assertions.system.test.ts`. Two things are left:

1. `vendor/turbo-rails/v2.0.23/test/system/broadcasts_test.rb` (156 lines, 13 tests plus the
   private `reconnect_cable_stream_source`, `assert_broadcasts_text` and
   `assert_forwards_turbo_stream_tag_attribute` helpers) is not yet ported.
2. `config.turbo.testConnectAfterActions` defaults to `["visit"]` (`packages/turbo/lib/engine.ts:71`,
   Rails `engine.rb:8`), and `SystemTestCase` has no `visit`. On 2026-11-19 the operator ruled
   "change default". The only navigation member `SystemTestCase` answers is `page()`, but
   wrapping it recurses, because `connectTurboCableStreamSources` calls `this.page()`
   (`lib/system-test-helper.ts:156`). Choose a default that names a method that is safe to wrap.

## Acceptance criteria

- `packages/turbo/test/system/broadcasts.system.test.ts` ports every test in broadcasts_test.rb
  under its Rails name.
- `testConnectAfterActions` defaults to `[]` (operator ruling 2026-11-19, trails#10377): no
  `SystemTestCase` member is safe to wrap without new extra surface, and `[]` is the setting
  `system_test_helper.rb:26` documents. The assignment carries
  `@missingRailsArgs test_connect_after_actions= — PERMANENT`.
