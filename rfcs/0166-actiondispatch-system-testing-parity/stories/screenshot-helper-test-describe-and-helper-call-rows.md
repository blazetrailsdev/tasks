---
title: "Re-describe screenshot_helper_test.rb under its Rails class and converge ScreenshotHelper's call rows"
status: draft
updated: 2026-09-28
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "vendor-capybara-and-port-its-driver-and-server-registry",
    "port-capybara-dsl-and-minitest-assertions-modules",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/screenshot_helper_test.rb`:
all 17 tests match by name in
`packages/actionpack/src/action-dispatch/dispatch/system-testing/screenshot-helper.test.ts`,
and all 17 are "wrong describe": trails nests them under
`ActionDispatch::SystemTesting::TestHelpers::ScreenshotHelper`, where the
extractor records `ScreenshotHelperTest`. It is the only trails file that names
Capybara today.

`ScreenshotHelper` (`system_testing/test_helpers/screenshot_helper.rb`) reads
`Capybara.current_driver` and `page` in four places; two call baseline rows sit
in `actiondispatch/system-testing/test-helpers/screenshot-helper.json`.

## Acceptance criteria

- The describe block is `ScreenshotHelperTest`; all 17 leave "wrong describe".
- `ScreenshotHelper` reads Capybara through the new package; the two call rows
  are converged and deleted.
