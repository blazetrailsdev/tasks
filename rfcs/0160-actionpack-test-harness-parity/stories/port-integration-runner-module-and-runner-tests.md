---
title: "port-integration-runner-module-and-runner-tests"
status: ready
updated: 2026-09-30
rfc: "0160-actionpack-test-harness-parity"
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

`ActionDispatch::Integration::Runner`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:334-451`)
has no trails counterpart. `IntegrationTest`
(`packages/actionpack/src/action-dispatch/testing/integration.ts:54`) collapses
`Session` and `Runner` into one class, and its `integrationSession` getter
(`:394`) returns `this` rather than `@integration_session ||= create_session(app)`.

Two Rails test files exercise the module directly and so cannot be ported until
it exists (surfaced by `port-assertion-and-test-request-response-skips`):

- `vendor/rails/v8.0.2/actionpack/test/controller/runner_test.rb:7-22` —
  `ActionDispatch::RunnerTest#test_respond_to?`: a class that `include`s
  `Integration::Runner` with `@integration_session` set to an arbitrary object
  answers `respond_to?` for the object's methods (`respond_to_missing?`,
  `integration.rb:437-439`).
- `vendor/rails/v8.0.2/actionpack/test/dispatch/runner_test.rb:5-18` —
  `RunnerTest "runner preserves the setting of integration_session"`: an object
  `extend`ed with `Integration::Runner` keeps `integration_session.host!` across
  `before_setup` (`integration.rb:347-354`).

`method_missing` / `respond_to_missing?` delegation is decided per class by
CLAUDE.md § "Ruby protocol methods with a different JS mechanism"; this class is
not yet in that table.

## Acceptance criteria

- `Integration::Runner` exists as an includable/extendable module in
  `integration.ts`, with `APP_SESSIONS`, `integration_session`, `reset!`,
  `create_session`, `remove!`, the generated request delegators,
  `open_session`, `copy_session_variables!`, `default_url_options(=)` and the
  `respond_to_missing?` / `method_missing` delegation, bodies per
  `integration.rb:334-451`. `IntegrationTest` includes it as Rails does
  (`integration.rb:~650`).
- The delegation mechanism's row is added to the CLAUDE.md table.
- `packages/actionpack/src/action-controller/controller/runner.test.ts` and
  `packages/actionpack/src/action-dispatch/dispatch/runner.test.ts` exist and
  report complete in `pnpm parity:test`.
