---
title: "activesupport logging, notifications and deprecation assertion parity"
status: ready
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["activesupport"]
deps: []
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

RFC 0105 counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number, a different kind, or a different
expected value than the Rails test is not a port of that test. PR #6507 widened
`ASSERTION_REPORT_PACKAGES` (`scripts/test-compare/compare.ts:76-88`) from
activerecord alone to the full RFC 0105 closure and seeded
`scripts/test-compare/assertion-mismatch-mark.json` at the measured values,
surfacing 5,036 divergences across the non-AR packages. The triage story
`burn-down-non-ar-assertion-parity-debt` split that total into this cluster and
its siblings; this one burns down the `activesupport` files below.

Measured 2026-08-14 (`pnpm parity:test -- --assertions --package activesupport`),
against `vendor/rails/activesupport/test/`:

| Rails test file                              | count | kind | value |
| -------------------------------------------- | ----: | ---: | ----: |
| `deprecation_test.rb`                        |    29 |   59 |     2 |
| `notifications_test.rb`                      |    18 |   30 |     2 |
| `broadcast_logger_test.rb`                   |     7 |   30 |     0 |
| `logger_test.rb`                             |    13 |   17 |     1 |
| `lazy_load_hooks_test.rb`                    |    12 |   12 |     0 |
| `tagged_logging_test.rb`                     |     8 |    9 |     3 |
| `notifications/instrumenter_test.rb`         |     5 |    9 |     0 |
| `backtrace_cleaner_test.rb`                  |     5 |    7 |     0 |
| `deprecation/method_wrappers_test.rb`        |     5 |    7 |     0 |
| `subscriber_test.rb`                         |     3 |    8 |     0 |
| `error_reporter_test.rb`                     |     2 |    7 |     0 |
| `log_subscriber_test.rb`                     |     2 |    7 |     0 |
| `rescuable_test.rb`                          |     2 |    4 |     3 |
| `executor_test.rb`                           |     2 |    4 |     2 |
| `benchmarkable_test.rb`                      |     2 |    6 |     0 |
| `notifications/evented_notification_test.rb` |     2 |    5 |     0 |
| `actionable_error_test.rb`                   |     3 |    4 |     0 |
| `deprecation/deprecators_test.rb`            |     2 |    3 |     0 |
| `clean_logger_test.rb`                       |     1 |    1 |     2 |
| `silence_logger_test.rb`                     |     2 |    2 |     0 |
| `deprecation/proxy_wrappers_test.rb`         |     0 |    3 |     0 |

**374 divergences** (125 assertion-count, 234 assertion-kind, 15
assertion-value). Expand per test with
`pnpm parity:test -- --assertions --missing --package activesupport` and grep for the
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

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope or dropping a
  measured package).
- No test name changes; `pnpm parity:test` percent for activesupport does not drop.
- No new rows in `scripts/parity/unported-files/`.
