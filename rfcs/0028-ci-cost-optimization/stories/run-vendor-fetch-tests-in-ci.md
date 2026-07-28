---
title: "run-vendor-fetch-tests-in-ci"
status: closed
updated: 2026-07-28
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
closed-reason: "Premise still live (vendor/fetch.test.ts remains the sole KNOWN_UNRUN entry in scripts/ci-suite-coverage.test.ts:30) but off-charter for RFC 0028: wiring a currently-failing suite into CI ADDS billed minutes and wall time, it does not cut them. No wall-time win exists for it to clear this RFC's go/no-go gate. Closed as part of the RFC close-out; refile under a test-coverage RFC if the signal is wanted. Note: the KNOWN_UNRUN comment still names this story id."
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
