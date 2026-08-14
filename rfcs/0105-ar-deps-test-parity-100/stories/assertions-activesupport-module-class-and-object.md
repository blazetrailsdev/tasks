---
title: "activesupport Module / Class / Object core_ext assertion parity"
status: ready
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 350
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

| Rails test file                                         | count | kind | value |
| ------------------------------------------------------- | ----: | ---: | ----: |
| `core_ext/module_test.rb`                               |    25 |   37 |    12 |
| `concern_test.rb`                                       |     8 |   14 |     2 |
| `core_ext/module/attribute_accessor_per_thread_test.rb` |    10 |   11 |     3 |
| `core_ext/module/attribute_accessor_test.rb`            |    12 |   11 |     1 |
| `core_ext/object/try_test.rb`                           |     5 |    5 |     6 |
| `core_ext/object/to_query_test.rb`                      |     2 |   10 |     3 |
| `core_ext/secure_random_test.rb`                        |     6 |    6 |     0 |
| `core_ext/module/introspection_test.rb`                 |     5 |    6 |     0 |
| `core_ext/class/attribute_test.rb`                      |     5 |    5 |     0 |
| `core_ext/object/inclusion_test.rb`                     |     2 |    7 |     1 |
| `core_ext/object/deep_dup_test.rb`                      |     4 |    5 |     0 |
| `core_ext/module/attr_internal_test.rb`                 |     4 |    4 |     1 |
| `core_ext/digest/uuid_test.rb`                          |     4 |    4 |     0 |
| `core_ext/module/concerning_test.rb`                    |     3 |    4 |     1 |
| `core_ext/object/blank_test.rb`                         |     4 |    4 |     0 |
| `core_ext/file_test.rb`                                 |     2 |    4 |     0 |
| `core_ext/kernel_test.rb`                               |     2 |    3 |     1 |
| `core_ext/object/with_test.rb`                          |     3 |    3 |     0 |
| `core_ext/module/remove_method_test.rb`                 |     3 |    3 |     0 |
| `core_ext/module/attribute_aliasing_test.rb`            |     2 |    2 |     1 |
| `core_ext/name_error_test.rb`                           |     2 |    2 |     0 |
| `core_ext/object/acts_like_test.rb`                     |     2 |    2 |     0 |
| `core_ext/load_error_test.rb`                           |     1 |    2 |     0 |
| `core_ext/object/json_cherry_pick_test.rb`              |     1 |    2 |     0 |
| `core_ext/module/anonymous_test.rb`                     |     1 |    2 |     0 |
| `descendants_tracker_test.rb`                           |     0 |    3 |     0 |
| `core_ext/object/instance_variables_test.rb`            |     1 |    1 |     0 |
| `core_ext/object/to_param_test.rb`                      |     1 |    1 |     0 |
| `core_ext/class_test.rb`                                |     0 |    2 |     0 |
| `core_ext/object/duplicable_test.rb`                    |     0 |    1 |     0 |

**318 divergences** (120 assertion-count, 166 assertion-kind, 32
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
