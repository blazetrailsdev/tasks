---
title: "CI guard: @blazetrails/actionview/test-case loads from the built dist"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9199
claim: "2026-10-21T22:29:25Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

## Context

trails#9162 publishes `ActionView::TestCase` (`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb`, which requires `action_controller` / `action_controller/test_case` at `:4-5`). It does so through a separate project, `packages/actionview/tsconfig.test-case.json`. The root `tsconfig.json` builds that project after `packages/actionpack` and emits `packages/actionview/dist/test-case.{js,d.ts}`, which the `./*` export resolves as `@blazetrails/actionview/test-case`. The only check that the published entry loads was a manual plain-node `import()` of the built dist. Nothing in CI fails if the project is dropped from the root solution or stops emitting into `dist`.

## Acceptance criteria

- A CI-run check (a `scripts/*.test.ts` in Preflight/Unit Tests, or an existing dist-import guard extended) imports `@blazetrails/actionview/test-case` from the built `dist` with plain node, and asserts that `TestCase` and `TestController` are exported.
- The check fails if `packages/actionview/tsconfig.test-case.json` is removed from the root `tsconfig.json` references.
