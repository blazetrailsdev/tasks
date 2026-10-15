---
title: "Port system_testing/browser.rb onto Playwright launch options"
status: draft
updated: 2026-10-15
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: ["ratify-vitest-native-system-testing-section"]
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

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/browser.rb`
is absent in trails (0/9: `initialize`, `name`, `type`, `options`, `configure`,
`preload`, `default_chrome_options`, `default_firefox_options`,
`resolve_driver_path`; `browser.rb:10-65`). Rails builds
`Selenium::WebDriver::Chrome::Options` / `Firefox::Options` there. Under the
RFC 0166 design there is no Selenium: `Browser` builds Playwright
`LaunchOptions`, the same object Vitest's `playwright` browser provider passes
as `launch`.

## Acceptance criteria

- `packages/actionpack/src/action-dispatch/system-testing/browser.ts` ports
  all nine members at their Rails names, in Rails order.
- `type` maps `headless_chrome` to `chrome` and `headless_firefox` to
  `firefox` exactly as Rails does; `chrome` launches Playwright's `chromium`
  with `channel: "chrome"` only when the caller asks for it.
- `default_chrome_options` adds `--disable-search-engine-choice-screen`, adds
  `--headless` for `headless_chrome`, adds `--disable-gpu` on Windows;
  `default_firefox_options` adds `-headless` for `headless_firefox`. Each
  argument lands in `LaunchOptions.args`, with `headless` set to match.
- `configure` yields `options` to the capabilities block.
- `preload` / `resolve_driver_path` resolve the browser executable through
  Playwright's `executablePath()` and raise if it is not installed, at the
  same point Rails' `DriverFinder` would.
- No `selenium-webdriver` dependency and no Capybara name anywhere.
- Receipts cite the ratified section from
  `ratify-vitest-native-system-testing-section`.
