---
title: "Converge SystemTesting::Driver onto Capybara registration with Rails' four drivers"
status: draft
updated: 2026-09-28
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "vendor-capybara-and-port-its-driver-and-server-registry",
    "port-system-testing-browser-over-selenium-webdriver",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SystemTesting::Driver`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/driver.rb`)
stores `@driver_type`, `@screen_size`, `@options`, `@name` and `@capabilities`,
builds a `Browser` for `:selenium` (`:10-24`), and on `use` registers with
Capybara through one of `register_selenium(app)`, `register_cuprite(app)`,
`register_rack_test(app)` or `register_playwright(app)` (`:55-69`), then sets
`Capybara.current_driver`.

trails' `packages/actionpack/src/action-dispatch/system-testing/driver.ts` is a
Playwright launcher (`requirePlaywright`, `PlaywrightBrowser`,
`PlaywrightPage`). `pnpm parity:api --arity` reports all four `register_*`
methods taking no argument, and
`scripts/api-compare/call-mismatches-exclude/actiondispatch/system-testing/driver.json`
holds nine rows.

## Acceptance criteria

- `Driver` has Rails' ivars, `use`, `register`, `setup` and the four
  `register_*(app)` methods, each calling `Capybara.registerDriver` as Rails
  does; the Playwright code is `register_playwright`'s body.
- The four arity rows are gone and `driver.json` is empty.
