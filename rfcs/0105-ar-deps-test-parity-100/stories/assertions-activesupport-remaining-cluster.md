---
title: "activesupport testing, JSON, XmlMini and remaining assertion parity"
status: done
updated: 2026-08-18
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 360
priority: null
pr: 6640
claim: "2026-08-17T10:49:51Z"
assignee: "assertions-activesupport-cache-and-messages"
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

| Rails test file                          | count | kind | value |
| ---------------------------------------- | ----: | ---: | ----: |
| `test_case_test.rb`                      |    34 |   38 |     5 |
| `callbacks_test.rb`                      |    16 |   26 |     1 |
| `xml_mini_test.rb`                       |     5 |   25 |    13 |
| `number_helper_test.rb`                  |    16 |   16 |     1 |
| `current_attributes_test.rb`             |    12 |   14 |     2 |
| `testing/method_call_assertions_test.rb` |    10 |   11 |     0 |
| `json/encoding_test.rb`                  |     4 |    7 |     3 |
| `parameter_filter_test.rb`               |     7 |    7 |     0 |
| `configurable_test.rb`                   |     6 |    5 |     2 |
| `array_inquirer_test.rb`                 |     4 |    7 |     0 |
| `option_merger_test.rb`                  |     2 |    4 |     0 |
| `string_inquirer_test.rb`                |     1 |    5 |     0 |
| `callback_inheritance_test.rb`           |     1 |    3 |     0 |
| `deep_mergeable_test.rb`                 |     2 |    2 |     0 |
| `gzip_test.rb`                           |     1 |    3 |     0 |
| `configuration_file_test.rb`             |     2 |    2 |     0 |
| `json/decoding_test.rb`                  |     1 |    1 |     0 |
| `digest_test.rb`                         |     1 |    1 |     0 |
| `xml_mini/xml_mini_engine_test.rb`       |     0 |    1 |     0 |
| `environment_inquirer_test.rb`           |     0 |    1 |     0 |

**331 divergences** (125 assertion-count, 179 assertion-kind, 27
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

## Progress

PR #6640 converged 8 of the 20 files: `gzip_test.rb`,
`callback_inheritance_test.rb`, `configuration_file_test.rb`,
`deep_mergeable_test.rb`, `option_merger_test.rb`, `digest_test.rb`,
`xml_mini/xml_mini_engine_test.rb`, `environment_inquirer_test.rb` — each now at
0 assertion-count / 0 kind / 0 value.

The other 12 (`test_case_test.rb`, `callbacks_test.rb`, `xml_mini_test.rb`,
`number_helper_test.rb`, `current_attributes_test.rb`,
`testing/method_call_assertions_test.rb`, `json/encoding_test.rb`,
`parameter_filter_test.rb`, `configurable_test.rb`, `array_inquirer_test.rb`,
`string_inquirer_test.rb`, `json/decoding_test.rb`) are untouched and are owned
by `assertions-activesupport-cluster-tail`, which records the specific blocker
per file — four of them need an implementation convergence rather than a test
edit. Whoever claims this next only has those 12 left; measure first, since the
8 above already report clean.

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope or dropping a
  measured package).
- No test name changes; `pnpm parity:test` percent for activesupport does not drop.
- No new rows in `scripts/parity/unported-files/`.
