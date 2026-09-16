---
title: "assertions-associations-test"
status: ready
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertions-associations-and-eager` (RFC 0132), which converged
`associations/eager_test.rb`, `eager_singularization_test.rb` and
`eager_load_nested_include_test.rb` but could not fit
`vendor/rails/activerecord/test/cases/associations_test.rb` under the PR LOC
ceiling.

Measured 2026-09-15 (`pnpm parity:test -- --package activerecord --assertions --missing`):
`associations_test.rb` → `packages/activerecord/src/associations.test.ts`,
~37 assertion-count and ~89 assertion-kind divergences across ~75 tests
(e.g. `preload with instance dependent scope — rails 7 vs trails 3`,
`push does not load target — equal 0 vs 1, includes 1 vs 0`, the
`*_with_annotation_includes_a_query_comment` family where Rails uses
`assert_queries_match` + `assert_not`).

Recurring mechanical shapes (all used in the eager PR):

- `expect(x).toHaveLength(n)` → `expect(x.length).toBe(n)` (Rails `assert_equal n, x.size`).
- `toBe(true)`/`toBe(false)` where Rails uses `assert`/`assert_not` → `toBeTruthy()`/`toBeFalsy()` or `assertNot`.
- `toBeGreaterThan(0)` where Rails has `assert_not_empty` → `assertNotEmpty`.
- `rejects.toThrow` where Rails does `assert_raises` + `assert_match` → `assertRaises([K], {}, fn)` + `expect(e.message).toMatch`.
- `resolves.toBeDefined()` / try-catch where Rails has `assert_nothing_raised` → `assertNothingRaised` from `@blazetrails/activesupport`.
- Missing `assert_queries_count` / `assert_no_queries` wrappers → `assertQueriesCount` / `assertNoQueries`.
- A local lambda named `assert*` gets expanded per call by the TS extractor; inline it or loop instead.

## Acceptance criteria

- `associations_test.rb` reports 0 assertion-count, 0 assertion-kind, 0
  assertion-value mismatches in `pnpm parity:test -- --package activerecord --assertions`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered via
  `pnpm parity:test:assertions:reseed` by exactly this contribution.
- No test name changes; TS-only extra coverage moves to a `.trails.test.ts`.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
