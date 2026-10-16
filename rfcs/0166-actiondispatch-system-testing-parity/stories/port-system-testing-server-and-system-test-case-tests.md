---
title: "Port server_test.rb, system_test_case_test.rb and abstract_unit's DrivenBy classes"
status: ready
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "converge-server-onto-in-process-vite-dev-server",
    "converge-system-test-case-onto-test-case-with-page-and-expect-element",
    "port-actionpack-abstract-unit-test-support",
    "converge-driver-selenium-arm-onto-webdriverio",
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
  `ServerTest` (`:7`), 3 tests — the port is always included, and the server
  is switched to Puma only from the default. Under RFC 0166 they assert the
  Vite dev server's resolved URL carries its port, and that `set_server`
  creates the Vite server only when none was configured.
- `…/system_testing/system_test_case_test.rb`: six one-test classes
  (`SetDriverToRackTestTest`, `OverrideSeleniumSubclassToRackTestTest`,
  `OverrideDriverWithExplicitName`, `SetDriverToSeleniumTest`,
  `SetDriverToSeleniumHeadlessChromeTest`,
  `SetDriverToSeleniumHeadlessFirefoxTest`) that assert
  the session library's current driver; trails asserts `self.class.driver.name`, the
  value Rails' `Driver#setup` copies there.
- They subclass `DrivenByRackTest`, `DrivenBySeleniumWithChrome`,
  `DrivenBySeleniumWithHeadlessChrome` and `DrivenBySeleniumWithHeadlessFirefox`
  (`test/abstract_unit.rb:518-533`), which RFC 0160 leaves to this one.

## Acceptance criteria

- The four `DrivenBy*` classes join the harness.
- Both Rails files are ported at `dispatch/system-testing/server.test.ts` and
  `system-test-case.test.ts` with no third-party session-library name, and report complete; each
  reworded assertion carries an `assertion-receipts.ts` row citing the
  ratified section.
