---
title: "A system Vitest project, a browser CI lane and the generated application system test case"
status: draft
updated: 2026-10-15
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack", "trailties"]
deps: ["converge-system-test-case-onto-test-case-with-page-and-expect-element"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0166 runs system tests in Node Vitest workers that launch real browsers.
Nothing in trails' vitest config or CI installs browsers or isolates these
tests, and trailties' generated application `test/` tree has no system-test
entry point (Rails generates `test/application_system_test_case.rb`).

## Acceptance criteria

- A `system` Vitest project (root `vitest.config.ts`) matches
  `**/*.system.test.ts`, runs in `forks` with one browser per worker, and is
  excluded from the default unit projects.
- CI gains a lane that runs `playwright install --with-deps chromium firefox`
  and the `system` project; webkit and webdriverio are not installed by
  default.
- trailties' app generator writes `test/application-system-test-case.ts`
  subclassing `SystemTestCase` with `drivenBy("selenium", { using: "headless_chrome" })`,
  mirroring Rails' template, plus the `system` project entry in the app's
  vitest config.
- The devcontainer generator stops writing `CAPYBARA_SERVER_PORT`
  (`packages/trailties/src/generators/rails/devcontainer/devcontainer-generator.ts:141,246`)
  and uses a trails-named variable feeding `servedBy`.
