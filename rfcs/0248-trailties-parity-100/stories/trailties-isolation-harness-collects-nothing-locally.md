---
title: "trailties-isolation-harness-collects-nothing-locally"
status: in-progress
updated: 2026-11-27
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10846
claim: "2026-11-27T17:21:17Z"
assignee: "trailties-isolation-harness-collects-nothing-locally"
blocked-by: null
closed-reason: null
---

## Context

Locally (node 26.13.0, vitest 3.2.4, vite 7.3.1, after `pnpm build`), every
`--project trailties` run collects 0 tests and exits 0, e.g.
`pnpm exec vitest run --project trailties packages/trailties/test/application/version.test.ts`.
`ISOLATION_DIST=1` and `CI=true` change nothing. main's CI is green.

Findings:

- vitest loads all globalSetup files concurrently
  (`loadGlobalSetupFiles`: `Promise.all`, vitest `dist/chunks/cli-api.*.js:5793`).
  Loading `packages/trailties/test/support/isolation/global-setup.ts` as an entry
  stalls at its first import, `@blazetrails/ruby-compat/dir`, while the
  `build-templates.ts` entries load. Nothing is pending (`getActiveResourcesInfo()`
  shows only PipeWraps), so node drains the loop and vitest exits 0.
- When that file is dropped from the globalSetup list, or imported dynamically
  inside a probe setup, the run proceeds and `version.test.ts` passes.
- With global-setup.ts's imports moved inside `setup()`, globalSetup completes,
  but the test worker raises `TypeError: Cannot set properties of undefined
(setting 'BasicObject')` at `packages/ruby-compat/lib/variable.ts` (reached
  through `include.ts:43`). The `bin/trails test` subprocess also exits non-zero
  with empty output, so the app-side vitest seems to hit the same ruby-compat
  import-cycle problem.

This blocks local verification of every isolation-harness port in RFC 0248
(the test-runner, plugin test-runner, engine, multi-dbs and test_test
remainder stories).

## Acceptance criteria

- [ ] Root-cause why the ruby-compat import cycle stalls or leaves `TopLevel` undefined under vite-node, and stop the trailties globalSetup files from entering it concurrently. The cycle fix itself is `ruby-compat-variable-reads-toplevel-at-module-eval`.
- [ ] `pnpm exec vitest run --project trailties packages/trailties/test/application/version.test.ts` and `... test-runner.test.ts -t "run single file$"` pass locally.
