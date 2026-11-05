---
title: "system-testing driver reaches playwright through a constant import specifier"
status: draft
updated: 2026-11-05
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/system-testing/driver.ts:24-31` loads `playwright` with `await import(PLAYWRIGHT_MODULE)`, where `const PLAYWRIGHT_MODULE = "playwright"`. That file is in published `src/` and reachable from the `./system-testing` entry. An AOT compiler that folds a top-level string constant can resolve the specifier and compile playwright into the binary. trails#9747 removed the same shape for `vite`/`vitest`: `SystemTestCase.startApplication(vitest, viteModule)` now takes both from the caller.

`packages/actionpack/src/published-entry-points.trails.test.ts` flags literal and `const X = "vite"|"vitest"` specifiers. Its `FORBIDDEN_PACKAGES` / `FORBIDDEN_CONSTANT` do not yet include `playwright`.

Rails: `actionpack/lib/action_dispatch/system_testing/driver.rb` requires the browser gem lazily (`register_selenium`, `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/driver.rb`). Its equivalent here is the caller supplying the playwright module.

## Acceptance criteria

- No `import()` of `playwright` (literal or constant-held) in `packages/actionpack/src` non-test files. The caller supplies the module, as `startApplication` does for vite/vitest.
- `published-entry-points.trails.test.ts` adds `playwright` to its forbidden set and still passes.
- The system tests (`*.system.test.ts`) still drive a real browser.
