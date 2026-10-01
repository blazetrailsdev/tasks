---
title: "ActionController::TestCase does not include ActionDispatch::TestProcess"
status: claimed
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-01T16:56:27Z"
assignee: "red-fcbc702b"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::TestCase::Behavior` includes `ActionDispatch::TestProcess`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:373`), so
every controller test answers `session`, `flash`, `cookies`, `redirect_to_url`,
`assigns` and `fixture_file_upload` from that module
(`action_dispatch/testing/test_process.rb`).

trails' `TestCase` (`packages/actionpack/src/action-controller/test-case.ts`)
does not include it. Three things stand in:

- `session`, `flash` and `cookies` are hand-written getters on the class
  (`test-case.ts:239,243,247`). `flash` reads `controller.flash ?? new FlashHash()`
  where `TestProcess#flash` reads `@request.flash`.
- `fixtureFileUpload`, `redirectToUrl` and `assigns` reach a test only at run
  time, through the test support's
  `include(ActionControllerTestCase, TestProcess)`
  (`packages/actionpack/src/test-helpers/abstract-unit.ts:305`, mirroring
  `abstract_unit.rb`), and have no type side. A test file has to declare them on
  its own subclass
  (`packages/actionpack/src/action-controller/controller/test-case.test.ts:582-583`)
  or cast the test to `TestProcessHost`.
- `response` is typed `Response` (`test-case.ts:237`), though it is always a
  `TestResponse` or `LiveTestResponse` (`test_case.rb:567-571,583`), so
  `response.parsed_body` needs a cast (`test-case.test.ts:1161,1166`).

## Acceptance criteria

- `TestCase` includes `TestProcess` itself, as `test_case.rb:373` does, with the
  `Included<>` type side; the hand-written `session` / `flash` / `cookies`
  getters are removed and the module's members answer in their place.
- `response` is typed so `parsedBody` reads without a cast.
- The `declare fixtureFileUpload` / `declare redirectToUrl` lines and the
  `as TestResponse` casts in `controller/test-case.test.ts` are removed, and no
  actionpack test casts a test case to `TestProcessHost` to call a `TestProcess`
  method.
