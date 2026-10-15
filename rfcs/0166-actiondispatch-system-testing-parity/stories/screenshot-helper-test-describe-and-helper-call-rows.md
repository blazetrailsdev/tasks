---
title: "Converge ScreenshotHelper and SetupAndTeardown onto the Vitest lifecycle; re-describe screenshot_helper_test.rb"
status: draft
updated: 2026-09-28
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: ["converge-system-test-case-onto-test-case-with-page-and-expect-element"]
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
all 17 under the wrong describe (`ActionDispatch::SystemTesting::TestHelpers::ScreenshotHelper`
where the extractor records `ScreenshotHelperTest`).

`packages/actionpack/src/action-dispatch/system-testing/test-helpers/screenshot-helper.ts`
reads two third-party environment variables (`:85`, `:132`)
and a trails-invented `TRAILS_SYSTEM_TESTING_SCREENSHOT_HTML`; the test file
stubs the first and names the library in a test title (`:58`). Rails'
`screenshots_dir` (`screenshot_helper.rb:94-96`), `output_type`
(`:120-128`), `take_failed_screenshot`'s session guard (`:53-60`),
`supports_screenshot?` (`:158-160`) and `SetupAndTeardown#after_teardown`
(`setup_and_teardown.rb:15-19`) each read or reset third-party session state. Call baseline
`system-testing/test-helpers/screenshot-helper.json` holds 2 rows.

## Acceptance criteria

- No third-party session-library name in either file or the test (the one
  Rails test name that spells it follows the owner's answer to RFC 0166
  open question 2): `screenshots_dir` reads
  Vitest's `browser.screenshotDirectory` setting, else `tmp/screenshots`;
  `output_type` reads `RAILS_SYSTEM_TESTING_SCREENSHOT` only; the
  `TRAILS_…_HTML` arm goes.
- `take_failed_screenshot` guards on the test having opened a `page`;
  `supports_screenshot?` on `self.class.driver.name != "rack_test"`;
  `failed?` reads the Vitest task result; `failure_screenshot_path` lands in
  the Vitest task `meta`, Rails' `metadata`.
- `after_teardown` closes the test's browser context (the reset Rails gets
  from `reset_sessions!`), in an `ensure` before `super`.
- The describe is `ScreenshotHelperTest`; the session-state assertions
  assert their Vitest carrier; all 17 report complete.
- The two call rows are converged and deleted, or receipted against the
  ratified section.
