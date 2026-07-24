---
title: "run-vendor-fetch-tests-in-ci"
status: ready
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# vendor/\*.test.ts never run in CI; fetch.test.ts fails locally

## Context

`vitest.config.ts` includes `vendor/*.test.ts` in the "other" project, but no
CI job passes a `vendor` path filter to `pnpm vitest run`, so
`vendor/fetch.test.ts` and `vendor/sources.test.ts` are local-only signal.
`pnpm vitest run vendor` currently reports 4 failures in `fetch.test.ts`
(1 file failed, 1 passed; 26 of 30 tests pass) in a worktree with vendor/
already populated — diagnose before wiring.

Tracked as KNOWN_UNRUN in `scripts/ci-suite-coverage.test.ts` (added by the
compare-script-tests-in-ci PR).

## Acceptance criteria

- `pnpm vitest run vendor` passes.
- `vendor` is wired into a CI job's vitest filters. Note the gate: `vendor/`
  already matches `COMPARISON_RE`, and the `rails-comparison` job is the one
  that runs `pnpm vendor:fetch` — if the tests need a populated vendor tree,
  that job is the right home; otherwise `unit-tests` plus a `vendor/` clause
  in `UNIT_TESTS_PKGS_RE`.
- The `vendor/*.test.ts` entries are deleted from `KNOWN_UNRUN` in
  `scripts/ci-suite-coverage.test.ts`.
