---
title: "i18n assertion parity"
status: done
updated: 2026-08-19
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["i18n"]
deps: [assertion-extractor-counts-mocha-expects]
deps-rfc: []
est-loc: 60
priority: null
pr: 6692
claim: "2026-08-18T12:28:47Z"
assignee: "assertions-activesupport-hash-and-ordered-options"
blocked-by: null
closed-reason: null
---

## Context

RFC 0105 counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number, a different kind, or a different
expected value than the Rails test is not a port of that test. PR #6507 widened
`ASSERTION_REPORT_PACKAGES` (`scripts/test-compare/compare.ts:76-88`) from
activerecord alone to the full RFC 0105 closure and seeded
`scripts/test-compare/assertion-mismatch-mark.json` at the measured values,
surfacing 5,036 divergences across the non-AR packages. The triage story
`burn-down-non-ar-assertion-parity-debt` split that total into this cluster and
its siblings; this one burns down the `i18n` files below.

Measured 2026-08-14 (`pnpm parity:test -- --assertions --package i18n`),
against `vendor/i18n/test/`:

| Rails test file                  | count | kind | value |
| -------------------------------- | ----: | ---: | ----: |
| `i18n_test.rb`                   |    10 |   12 |     0 |
| `backend/simple_test.rb`         |     5 |   10 |     0 |
| `backend/chain_test.rb`          |     1 |    4 |     0 |
| `i18n/exceptions_test.rb`        |     0 |    1 |     3 |
| `i18n/interpolate_test.rb`       |     1 |    1 |     1 |
| `backend/key_value_test.rb`      |     1 |    1 |     0 |
| `locale/fallbacks_test.rb`       |     0 |    1 |     1 |
| `backend/fallbacks_test.rb`      |     0 |    1 |     0 |
| `backend/transliterator_test.rb` |     0 |    1 |     0 |
| `backend/exceptions_test.rb`     |     0 |    0 |     1 |

**56 divergences** (18 assertion-count, 32 assertion-kind, 6
assertion-value). Expand per test with
`pnpm parity:test -- --assertions --missing --package i18n` and grep for the
file; each line prints `rails N vs trails M`, and the kind lines print the
per-kind delta. The trails counterparts are at the convention TS path the same
report prints beside the Ruby file.

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values (`assert_equal` -> `toEqual`, `assert_nil` -> `toBeNull`,
`assert_predicate`/`assert` -> the mapped kind in
`scripts/test-compare/assertion-kinds.ts`). Where the port legitimately cannot
mirror an assertion — a Ruby-only value protocol, an async surface that needs
`await expect(...)` — say so at the call site in a comment; do not reword the
test name (CLAUDE.md: test names are the parity key), and never loosen the
Rails side or reseed the mark upward.

If the cluster is larger than one PR, ship the files that fit and file the rest
as a sibling story under this RFC rather than growing the PR.

## Progress (2026-08-18, PR #6692)

56 of the 60 divergences converged: all 6 assertion-value rows, all 32
assertion-kind rows, and 12 of the 18 assertion-count rows. Eight of the ten
files above are at 0/0/0. The mark is down to `i18n: {assertionCount: 6, kind:
0, value: 0}`.

The 6 that remain are all one shape, in `i18n_test.rb` (5) and
`backend/chain_test.rb` (1): the Rails test verifies the call with mocha's
`expects`, which is a mock expectation verified at teardown and therefore counts
as **zero** minitest assertions, while the port spells the same check as an
explicit `expect(spy).toHaveBeenCalledWith(...)` — one assertion. Dropping the
trails assertion would leave those tests verifying nothing, so the fix is on the
Rails-extractor side and is owned by `assertion-extractor-counts-mocha-expects`.

This story stays open until that sibling lands and these two files reach 0.

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package i18n`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope or dropping a
  measured package).
- No test name changes; `pnpm parity:test` percent for i18n does not drop.
- No new rows in `scripts/parity/unported-files/`.
