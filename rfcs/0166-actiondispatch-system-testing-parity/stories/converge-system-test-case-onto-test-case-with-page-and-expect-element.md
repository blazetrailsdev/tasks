---
title: "SystemTestCase < ActiveSupport::TestCase with a Vitest page fixture and expect.element"
status: claimed
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps:
  ["converge-driver-onto-vitest-native-drivers", "converge-server-onto-in-process-vite-dev-server"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: "2026-10-16T14:44:53Z"
assignee: "debug-view-debug-params-uses-pp-and-templates-reach-inspect"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_test_case.rb`:
`SystemTestCase < ActiveSupport::TestCase` (`:114`) includes a third-party DSL
and its Minitest assertions, `SetupAndTeardown` and `ScreenshotHelper`
(`:115-118`), defaults to `driven_by(:selenium)` (`:122-126`), and resolves
url helpers against a configured app host, the session's server URL, or
`DEFAULT_HOST` (`:172-200`). trails'
`packages/actionpack/src/action-dispatch/system-test-case.ts` has no parent
class, defaults to `"playwright"`, and its `urlHelpers` returns `undefined`.

Under RFC 0166 the user-facing interaction surface is Vitest's, not
that library's: the test receives a `page` whose locators are the
`getByRole` / `getByText` / `getByLabel` / `getByTestId` API Vitest browser
mode exposes (Playwright locators, from which Vitest's API is drawn), and
asserts with `expect.element(locator)`, a retrying matcher entry point named
and shaped as in `@vitest/browser`, registered on Node-side `expect`.

## Acceptance criteria

- `SystemTestCase` extends `ActiveSupport::TestCase` and includes
  `SetupAndTeardown` and `ScreenshotHelper` with `include()`.
- The constructor defaults to `drivenBy("selenium")` as Rails does and calls
  `driver.use()`.
- `drivenBy(driver, { using = "chrome", screenSize = [1400, 1400], options = {} }, capabilities)`
  keeps Rails' defaults and forwards the capabilities block.
- `url_helpers` and its `method_missing` / `respond_to_missing?` pair are
  ported; `app_host` reads the configured app host, then the running Vite
  server's URL, then `DEFAULT_HOST`.
- `page` and `expect.element` (with `toBeVisible`, `toHaveTextContent`,
  `toBeInTheDocument`, `toHaveValue` as a first set) are receipted
  `@noRailsEquivalent PERMANENT` against the ratified section.
- A trails-only `system-test-case.trails.test.ts` drives one real page
  through the playwright driver.
