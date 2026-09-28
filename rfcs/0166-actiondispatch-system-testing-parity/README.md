---
rfc: "0166-actiondispatch-system-testing-parity"
title: "ActionDispatch system testing — SystemTestCase, Driver, Browser and Server over a Capybara port"
status: draft
created: 2026-09-27
updated: 2026-09-27
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0166 — ActionDispatch system testing: SystemTestCase, Driver, Browser and Server over a Capybara port

## Summary

Take `action_dispatch/system_test_case.rb` and `action_dispatch/system_testing/**`
(`Driver`, `Browser`, `Server`, `TestHelpers::ScreenshotHelper`,
`TestHelpers::SetupAndTeardown`) to 100% on every parity axis, and port the four
`test/dispatch/system_testing/*_test.rb` files.

Rails system testing is a thin layer over Capybara: `SystemTestCase`
`include Capybara::DSL` and `Capybara::Minitest::Assertions`
(`system_test_case.rb:114-116`), `Driver#register` calls
`Capybara.register_driver`, and `Server#run` sets `Capybara.server` and
`Capybara.always_include_port` (`system_testing/server.rb:24-29`). trails has no
Capybara; its `Driver` drives Playwright directly. So this RFC's first job is the
missing dependency, and it is scoped to the Capybara surface that Rails'
system-testing files reach — not to Capybara as a whole.

This is one of eight actionpack RFCs (0160–0167; RFC 0167 owns measurement fixes and gate enrollment).

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

- **`system_testing/browser.rb` is absent:** 0/9 (`initialize`, `name`, `type`,
  `options`, `configure`, `preload`, `default_chrome_options`,
  `default_firefox_options`, `resolve_driver_path`; `browser.rb:10-65`). It
  builds `Selenium::WebDriver::Chrome::Options` / `Firefox::Options`.
- **Arity:** `Driver#register_selenium(app)`, `#register_cuprite(app)`,
  `#register_rack_test(app)`, `#register_playwright(app)`
  (`system_testing/driver.rb:55-69`) take `app` — the argument
  `Capybara.register_driver` yields — and trails' take none;
  `Server#set_server()` takes none and trails' takes `(app, callback)`;
  `SystemTestCase.start_application()` (`system_test_case.rb:128`) takes none
  and trails' takes `(app)`.
- **Inheritance:** `SystemTestCase < ActiveSupport::TestCase`
  (`system_test_case.rb:114`); trails' has no parent.
- **Extra surface:** `system-testing/server.ts` moved `host`, `port`, `stop`.
- **Call baselines:** `actiondispatch/system-testing/driver.json` 9,
  `system-testing/server.json` 2,
  `system-testing/test-helpers/screenshot-helper.json` 2,
  `system-test-case.json` 1.
- **Tests:** `driver_test.rb` 0/18, `server_test.rb` 0/3,
  `system_test_case_test.rb` 0/6 (all absent at their convention paths), and
  `screenshot_helper_test.rb` 17/17 by name but all 17 under the wrong describe
  (`ActionDispatch::SystemTesting::TestHelpers::ScreenshotHelper` where the
  extractor records `ScreenshotHelperTest`).

The Rails gems involved, pinned by `vendor/rails/v8.0.2/Gemfile.lock`:
`capybara (3.40.0)` (`:160`) and `selenium-webdriver (4.29.1)` (`:543`).
Neither is vendored.

## Design

### A `capybara` package, scoped to what Rails reaches

Following the gem-port precedent (`rack`, `rack-session`, `rack-test` are
vendored and ported as packages), Capybara 3.40.0 is vendored and ported as a
`capybara` package — but only the surface
`action_dispatch/system_test_case.rb` and `system_testing/**` call:
`Capybara.register_driver` / `drivers` / `current_driver` / `default_driver` /
`javascript_driver`, `register_server` / `servers` / `server`,
`always_include_port`, `app_host`, `server_host` / `server_port`, and the
`Capybara::DSL` / `Capybara::Minitest::Assertions` modules `SystemTestCase`
includes. Each later addition is a story of its own.

### Browser options wrap the npm Selenium client

`Browser` builds `Selenium::WebDriver::Chrome::Options` /
`Firefox::Options`. The npm `selenium-webdriver` package has the same
`chrome.Options` / `firefox.Options` classes, so `Browser` wraps it as an
optional peer dependency (the `pg` / `mysql2` precedent in activerecord), and
anything that reaches the browser is async from the start.

### Playwright stays, as one of Rails' four drivers

Rails 8 registers `:selenium`, `:cuprite`, `:rack_test` and `:playwright`
(`driver.rb:55-69`). trails' Playwright code becomes the `register_playwright`
arm rather than the whole of `Driver`.

## Non-goals

- **Capybara beyond Rails' reach** — finders, matchers and node actions are not
  ported here; the DSL module ships with what `SystemTestCase` needs to be
  included, and grows by story.
- **Cuprite.** `register_cuprite` exists and registers with Capybara as Rails
  does; no Cuprite port is implied.

## Alternatives considered

- **Keep Driver on Playwright alone and receipt the gap.** Rails' system tests
  assert on `Capybara.current_driver` and `Selenium::WebDriver::Chrome::Options`;
  without them the four files cannot be ported, and a receipt would make the
  100% permanent fiction.
- **A local stand-in for `Capybara.register_driver`.** An invented registry with
  Capybara's names is still invented surface, and the next Capybara call would
  need another.

## Rollout

1. Dependencies — `vendor-capybara-and-port-its-driver-and-server-registry`,
   `port-system-testing-browser-over-selenium-webdriver`
2. Convergence — `converge-driver-onto-capybara-registration`,
   `converge-server-and-system-test-case-onto-capybara`
3. Tests — `port-system-testing-driver-test`,
   `port-system-testing-server-and-system-test-case-tests`,
   `screenshot-helper-test-describe-and-helper-call-rows`

## Verification

- `pnpm parity:api --package actiondispatch` reports `system_testing/browser.rb`
  9/9 and every `system_test*` row at 100%, with no arity or inheritance row.
- `pnpm parity:api:extra --package actiondispatch` lists no `system-testing/`
  file.
- No row remains in the four system-testing call baseline shards.
- `pnpm parity:test --package actiondispatch` reports all four
  `dispatch/system_testing/*_test.rb` files complete.

## Open questions

1. **Vendor Capybara, or port from the gem release without vendoring?**
   Recommendation: vendor it, as `rack`, `rack-session` and `rack-test` are —
   the port's `file:line` citations need a tree to resolve against, and the
   Preflight citation check (`scripts/vendor-citations.test.ts`) needs one to
   verify them. Deferred to `vendor-capybara-and-port-its-driver-and-server-registry`,
   which records the decision.

## Changelog

- 2026-09-27: initial RFC
