---
title: "Port server_test.rb, system_test_case_test.rb and abstract_unit's DrivenBy classes"
status: draft
updated: 2026-09-28
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "converge-server-and-system-test-case-onto-capybara",
    "converge-driver-onto-capybara-registration",
    "port-actionpack-abstract-unit-test-support",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/server_test.rb`:
  `ServerTest` (`:7`), 3 tests — the port is always included, and the server is
  switched to `:puma` only from the default.
- `…/system_testing/system_test_case_test.rb`: six one-test classes
  (`SetDriverToRackTestTest`, `OverrideSeleniumSubclassToRackTestTest`,
  `OverrideDriverWithExplicitName`, `SetDriverToSeleniumTest`,
  `SetDriverToSeleniumHeadlessChromeTest`,
  `SetDriverToSeleniumHeadlessFirefoxTest`) that assert
  `Capybara.current_driver`.
- They subclass `DrivenByRackTest`, `DrivenBySeleniumWithChrome`,
  `DrivenBySeleniumWithHeadlessChrome` and `DrivenBySeleniumWithHeadlessFirefox`
  (`test/abstract_unit.rb:518-533`), which RFC 0160 (test harness) leaves to this
  one.

## Acceptance criteria

- The four `DrivenBy*` classes join the harness.
- Both Rails files are ported at `dispatch/system-testing/server.test.ts` and
  `system-test-case.test.ts`, and report complete.
