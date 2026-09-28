---
title: "Converge SystemTesting::Server and SystemTestCase onto Capybara"
status: draft
updated: 2026-09-28
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "vendor-capybara-and-port-its-driver-and-server-registry",
    "integration-test-extends-active-support-test-case",
    "port-capybara-dsl-and-minitest-assertions-modules",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `SystemTesting::Server#run` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/server.rb:14`)
  calls `set_server` (`:24`: `Capybara.server = :puma, { Silent: … }` when it is
  still the default) and `set_port` (`:28`: `Capybara.always_include_port =
true`). trails' `set_server` takes `(app, callback)` and starts a server
  itself; `server.ts`'s `host`, `port` and `stop` are scored moved.
- `SystemTestCase < ActiveSupport::TestCase` (`system_test_case.rb:114`)
  includes `Capybara::DSL`, `Capybara::Minitest::Assertions`,
  `SetupAndTeardown` and `ScreenshotHelper`; `self.start_application` (`:128`)
  takes no arguments and builds the app from `ActionDispatch.test_app`;
  `driven_by` (`:158`) and `served_by` (`:167`) set class attributes. trails'
  `SystemTestCase` has no parent and `startApplication(app)`.
- Call rows: `system-testing/server.json` 2, `system-test-case.json` 1.

## Acceptance criteria

- `Server` and `SystemTestCase` have Rails' shapes and signatures; the two arity
  rows and the inheritance row are gone.
- The three call rows are converged and deleted; `server.ts` has no moved names.
