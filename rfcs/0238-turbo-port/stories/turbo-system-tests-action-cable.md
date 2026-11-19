---
title: "turbo-system-tests-action-cable"
status: ready
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps:
  - turbo-system-tests-broadcasts
  - turbo-streams-channel-class-path
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

`turbo-system-tests-harness` landed `packages/turbo/test/application-system-test-case.ts`
and `test/system/form-submissions.system.test.ts`. The remaining Rails system tests need a
live Action Cable websocket: `vendor/turbo-rails/v2.0.23/test/system/assertions_test.rb`
(3 tests, `assert_turbo_cable_stream_source connected: true`) and
`test/system/broadcasts_test.rb` (every test broadcasts to a connected
`<turbo-cable-stream-source>`). The system-test server
(`packages/actionpack/lib/action-dispatch/system-testing/server.ts`,
`SystemTestCase.startApplication` in `system-test-case.ts:72-85`) mounts the Rack app in
Vite but handles no websocket upgrade, so `/cable` never connects and
`connectTurboCableStreamSources` (`packages/turbo/lib/system-test-helper.ts:151`) waits forever.

Also: `config.turbo.testConnectAfterActions` defaults to `["visit"]`
(`packages/turbo/lib/engine.ts:74`, Rails `engine.rb:8`), and `engine.ts:261` wraps that
method on the system test case, but trails' `SystemTestCase` has no `visit` (navigation is
`page().goto`). Needs an operator ruling: port `visit` onto `SystemTestCase`, or a different default.

## Acceptance criteria

- The system-test server answers the Action Cable websocket upgrade at the app's cable mount.
- `assertions_test.rb` and `broadcasts_test.rb` are ported as
  `packages/turbo/test/system/{assertions,broadcasts}.system.test.ts` with Rails names verbatim.
- `testConnectAfterActions`'s default names a method `SystemTestCase` answers (after an operator ruling).
