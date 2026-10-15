---
title: "Converge Driver's four register arms onto Playwright, webdriverio and rack-test"
status: draft
updated: 2026-10-15
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-system-testing-browser-onto-playwright-launch-options"]
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

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/driver.rb`
(`:6-78`) hands a driver factory to the third-party session library and sets
its current driver (`:36-45`, `:72-74`). trails'
`packages/actionpack/src/action-dispatch/system-testing/driver.ts` launches
Playwright directly, makes three of four `register_*` arms throw, takes no
`app`, and has invented `newContext` / `newPage` / `close` members. Call
baseline `actiondispatch/system-testing/driver.json` holds 9 rows.

Under RFC 0166, `register` builds the launcher for the driver type and keeps
it under `name` in a module-private map (the memo that lets two test classes
driven by the same name share one browser per worker), and `setup` makes it
the browser the test's `page` fixture opens a context in. Arms:

- `:playwright` — Playwright launch with `screen` / `viewport` from
  `screen_size`, as `driver.rb:62-70`.
- `:selenium` — deferred to `converge-driver-selenium-arm-onto-webdriverio`;
  here `register_selenium(app)` keeps its Rails slot and raises
  `NotImplementedError`.
- `:cuprite` — Chrome over CDP through Playwright's `chromium`, with
  `window_size`.
- `:rack_test` — no browser: the `page` fixture is a `rack-test` session
  against `SystemTestCase`'s Rack app, and screenshots are unsupported.

`app` is the Rack app `start_application` builds, passed to each
`register_*` arm as Rails passes it.

## Acceptance criteria

- `initialize`, `use`, `registerable?`, `register`, `browser_options`, the
  four `register_*(app)` arms and `setup` mirror `driver.rb` line for line;
  `initialize` builds a `Browser` and preloads it for `:selenium` unless
  `options[:browser] == :remote`.
- `newContext` / `newPage` / `close` are removed from `Driver` (the page
  lifecycle belongs to `SetupAndTeardown`).
- The rows the convergence fixes are deleted from `driver.json`; any left
  carry a `@missingRailsCall … PERMANENT` receipt citing the ratified
  section.
