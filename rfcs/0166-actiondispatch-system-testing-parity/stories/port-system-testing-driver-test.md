---
title: "Port dispatch/system_testing/driver_test.rb"
status: draft
updated: 2026-09-27
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: ["converge-driver-onto-capybara-registration"]
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

`vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/driver_test.rb` is
one class, `DriverTest < ActiveSupport::TestCase` (`:7`), with 18 tests
(`:8-196`): initializing the driver for `:selenium` with and without a browser,
headless Chrome and Firefox with and without a custom driver path, `:cuprite`
and Playwright; extra capabilities for each Selenium browser; preloading the
driver path with `DriverFinder`; not configuring a browser for non-Selenium
drivers; and driver names. They assert on
`@driver_type`, `@browser.name`, `@browser.options` being a
`Selenium::WebDriver::Chrome::Options`, `@screen_size` and `@options`.

`packages/actionpack/src/action-dispatch/system-testing/driver.test.ts` holds
trails-only Playwright tests outside the convention path.

## Acceptance criteria

- `dispatch/system-testing/driver.test.ts` ports all 18 tests in Rails order.
- The trails-only tests move to a `.trails.test.ts` twin or are deleted.
- The file reports 18/18.
