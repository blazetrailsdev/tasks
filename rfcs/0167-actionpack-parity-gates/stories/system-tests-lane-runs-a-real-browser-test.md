---
title: "The system-tests lane runs a real browser system test"
status: ready
updated: 2026-10-16
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8984 added the `system` Vitest project (root `vitest.config.ts`, `packages/*/src/**/*.system.test.ts`) and the `system-tests` CI job (`.github/workflows/ci.yml`). That job installs chromium and firefox and runs `pnpm vitest run --project system --passWithNoTests`. No `*.system.test.ts` file exists, so the lane exercises nothing. Rails' system tests boot an app and drive a real browser: `vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/system_test_case_test.rb` and the generated `railties/lib/rails/generators/rails/app/templates/test/application_system_test_case.rb.tt`.

## Acceptance criteria

- At least one `*.system.test.ts` in actionpack drives a real Playwright browser against a Rack app through `SystemTestCase` (`drivenBy("playwright")`), visits a page and asserts with `expect.element`.
- The test also takes a screenshot on failure into the `provide`d `screenshotDirectory`.
- `--passWithNoTests` is removed from the `system-tests` job.
