---
title: "turbo-system-test-helper"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10351
claim: "2026-11-19T10:46:38Z"
assignee: "turbo-system-test-helper"
blocked-by: null
closed-reason: null
---

## Context

`turbo-test-helpers` shipped `Turbo::TestAssertions`, `IntegrationTestAssertions` and
`Broadcastable::TestHelper` (`packages/turbo/lib/test-assertions.ts`,
`lib/test-assertions/integration-test-assertions.ts`, `lib/broadcastable/test-helper.ts`).
Still unported:

- `vendor/turbo-rails/v2.0.23/lib/turbo/system_test_helper.rb:28-130`
  (`connect_turbo_cable_stream_sources`, `assert_turbo_cable_stream_source`,
  `assert_no_turbo_cable_stream_source`, `SignedStreamNameConditions` at `:108`).
- Wiring: `turbo.system_test_helper` (`engine.rb:133-138`), the `after_initialize`
  `test_connect_after_actions` overrides (`engine.rb:140-150`), and
  `turbo.integration_test_request_encoding`'s `TurboStreamEncoder` (`engine.rb:119-131`).
- Tests: `test/system/assertions_test.rb`, `system/broadcasts_test.rb`,
  `system/form_submissions_test.rb`, `capybara_selectors_test.rb`.
- `assert_turbo_stream` / `assert_turbo_frame` in `lib/test-assertions.ts` have no
  ported test yet (turbo-rails exercises them from `test/streams/streams_controller_test.rb`
  and frames tests via `as: :turbo_stream`, which needs the encoder).

## Acceptance criteria

- SystemTestHelper follows packages/actionpack/CLAUDE.md "System testing runs on Vitest";
  Capybara-selector arms with no counterpart parked `it.skip` with `PERMANENT-SKIP:`.
- `TurboStreamEncoder` registered on `ActionDispatch::RequestEncoder` so `as: "turbo_stream"` works.
- The integration-test `assertTurboStream` arms are covered by a ported Rails test.
