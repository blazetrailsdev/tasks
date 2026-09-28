---
title: "Port SystemTesting::Browser over the npm selenium-webdriver Options"
status: draft
updated: 2026-09-27
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/browser.rb`
has no trails counterpart (`pnpm parity:api --package actiondispatch`: 0/9):
`initialize(name)` (`:10`), `name`, `type` (`:14`), `options` (`:25`, a memoized
`Selenium::WebDriver::Chrome::Options` or `Firefox::Options`), `configure`
(`:35`, yields the options), `preload` (`:41`, resolves the driver path), and
private `default_chrome_options` (`:51`), `default_firefox_options` (`:59`) and
`resolve_driver_path(namespace)` (`:65`). `:headless_chrome` /
`:headless_firefox` add the `--headless` argument.

Rails requires `selenium-webdriver (4.29.1)`
(`vendor/rails/v8.0.2/Gemfile.lock:543`). The npm `selenium-webdriver` package
exports `chrome.Options` and `firefox.Options` with `addArguments`; the port
wraps it as an optional peer dependency, as activerecord does `pg` / `mysql2`,
and anything that touches the driver binary is async.

## Acceptance criteria

- `system-testing/browser.ts` ports all nine members at Rails' names over
  `selenium-webdriver`, which is an optional peer of `@blazetrails/actionpack`.
- `pnpm parity:api --package actiondispatch` reports `system_testing/browser.rb`
  9/9.
