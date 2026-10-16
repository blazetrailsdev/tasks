---
title: "Port Driver's :selenium arm onto webdriverio (deferred: Playwright first)"
status: closed
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: ["converge-driver-onto-vitest-native-drivers"]
deps-rfc: []
est-loc: 300
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "don't want selenium now."
---

## Context

Deferred by the repo owner on 2026-10-15: RFC 0166 ships Playwright first.
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/driver.rb:50-54`
(`register_selenium(app)`) builds a WebDriver driver with `Browser#type` and
`browser_options`, sized to `screen_size`. After
`converge-driver-onto-vitest-native-drivers`, trails' `register_selenium`
raises `NotImplementedError`. `driver_test.rb`'s `:selenium` tests and
`system_test_case_test.rb`'s `SetDriverToSelenium*` classes need this arm.

## Acceptance criteria

- `register_selenium(app)` drives the WebDriver protocol through
  `webdriverio` (the package behind Vitest's `webdriverio` provider), with
  `Browser#options` as capabilities and `screen_size` as window size;
  `options[:browser] == :remote` reaches a remote grid.
- `webdriverio` is an optional peer dependency of actionpack, loaded only by
  this arm.
- `Browser` builds the WebDriver capabilities for `chrome` / `firefox` and the
  headless variants alongside its Playwright launch options.
- The generated application system test case and test classes go back to
  Rails' `driven_by(:selenium, using: :headless_chrome)` default.
- No third-party session-library name.
