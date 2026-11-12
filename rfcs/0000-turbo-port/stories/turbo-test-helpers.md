---
title: "Port Turbo::TestAssertions, IntegrationTestAssertions, Broadcastable::TestHelper and SystemTestHelper"
status: draft
updated: 2026-11-12
rfc: "0000-turbo-port"
cluster: turbo
packages: [turbo]
deps: [turbo-broadcastable-class-methods-and-callbacks]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/turbo-rails/v2.0.23/lib/turbo/test_assertions.rb:2-157`: `assert_turbo_stream` (`:48`),
  `assert_no_turbo_stream` (`:76`), `assert_turbo_frame` (`:121`) and
  `assert_no_turbo_frame` (`:153`).
- `lib/turbo/test_assertions/integration_test_assertions.rb:41,69`.
- `lib/turbo/broadcastable/test_helper.rb:58,104,157`.
- `lib/turbo/system_test_helper.rb:28-130`, with `SignedStreamNameConditions`
  at `:108`.
- Wiring: the `turbo.test_assertions` (`engine.rb:94-117`),
  `turbo.integration_test_request_encoding` (`:119-131`, `TurboStreamEncoder`)
  and `turbo.system_test_helper` (`:133-152`) initializers.
- Tests: `vendor/turbo-rails/v2.0.23/test/broadcastable/test_helper_test.rb` (27),
  `system/assertions_test.rb`, `system/broadcasts_test.rb`,
  `system/form_submissions_test.rb` and `capybara_selectors_test.rb`.

## Acceptance criteria

- The assertions use `@blazetrails/vitest-matchers` / the minitest port as
  CONTRIBUTING.md's assertion table prescribes.
- The system-test helpers follow the "System testing runs on Vitest" ruling
  in `packages/actionpack/CLAUDE.md`. Capybara-selector arms that have no
  counterpart there are parked as `it.skip` with a `PERMANENT-SKIP:` line
  citing that section.
