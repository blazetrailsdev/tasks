---
title: "Minitest::Test#metadata; screenshot_helper_test uses a real DrivenBySeleniumWithChrome host"
status: ready
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ScreenshotHelper#take_failed_screenshot` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/test_helpers/screenshot_helper.rb:53-57`) writes `metadata[:failure_screenshot_path]` when `Minitest::Runnable.method_defined?(:metadata)`. Minitest defines `Runnable#metadata` as `@metadata ||= {}` and `metadata?` as `defined? @metadata` (minitest 6.0.6 `lib/minitest.rb:550-564`).

trails' `Minitest.Test` (`packages/activesupport/src/testing/assertions.ts:58`) has no `metadata`. So `takeFailedScreenshot` (`packages/actionpack/src/action-dispatch/system-testing/test-helpers/screenshot-helper.ts`) guards on `this.metadata`, and `screenshot-helper.test.ts` builds a plain-object host. Rails' `screenshot_helper_test.rb:9-11` uses `@new_test = DrivenBySeleniumWithChrome.new("x")` instead.

## Acceptance criteria

- `Minitest.Test` answers `metadata` (lazily `{}`) and `isMetadata`, as minitest's `Runnable` does.
- `takeFailedScreenshot`'s metadata guard reads the defined method, as Rails' `method_defined?(:metadata)` does.
- `screenshot-helper.test.ts` builds its host as `new DrivenBySeleniumWithChrome("x")` and stubs `isPassed` / `isSkipped` on that instance (`:52`, `:61-62`), with no `makeHost` object.
