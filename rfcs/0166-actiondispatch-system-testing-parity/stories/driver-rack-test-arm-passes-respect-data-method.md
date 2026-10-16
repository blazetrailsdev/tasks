---
title: "driver-rack-test-arm-passes-respect-data-method"
status: closed
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8988
claim: "2026-10-16T18:14:54Z"
assignee: "driver-rack-test-arm-passes-respect-data-method"
blocked-by: null
closed-reason: "FALSIFIED: criterion 1 (honour respectDataMethod / follow data-method links) requires Capybara's RackTest driver or a finder/action DSL, both barred by the RFC 0166 owner ruling (packages/actionpack/CLAUDE.md 'System testing runs on Vitest'); the args convergence (respectDataMethod: true, ...@options, driver.rb:63-65) lands in trails#8988."
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/driver.rb:63-65`
`register_rack_test(app)` builds
`Capybara::RackTest::Driver.new(app, respect_data_method: true, **@options)`.
trails' `packages/actionpack/src/action-dispatch/system-testing/driver.ts`
`registerRackTest` returns `new Session(app)` from `@blazetrails/rack-test`
(`packages/rack-test/src/test.ts:53`, `Rack::Test::Session`), which takes no
`respect_data_method` or driver options. Receipted
`@missingRailsArgs new — CONVERGEABLE` this story.

## Acceptance criteria

- A driver that wraps a rack-test session and honours `respectDataMethod`
  (Capybara's `data-method` link handling) and the remaining `@options`.
- `registerRackTest` passes `respectDataMethod: true, ...this._options` as Rails does.
- The `@missingRailsArgs` receipt on `registerRackTest` is removed.
