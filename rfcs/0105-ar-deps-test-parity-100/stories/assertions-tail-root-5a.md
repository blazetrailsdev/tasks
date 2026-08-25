---
title: "assertion parity tail: root files, batch 5a"
status: ready
updated: 2026-08-13
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number or a different kind of assertion
is not a port of that test. `pnpm parity:test -- --package activerecord
--assertions` reports these per file today (report-only,
`scripts/test-compare/compare.ts:606-663`), and RFC 0025's ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`, PR #5790) pins them so
they cannot grow. This story burns down one Rails source cluster.

Measured 2026-08-13 (`pnpm parity:test -- --cached --package activerecord --assertions`):

| Rails test file (under `vendor/rails/activerecord/test/cases/`) | count | kind | value |
| --------------------------------------------------------------- | ----: | ---: | ----: |
| `encryption/key_generator_test.rb`                              |     3 |    3 |     1 |
| `validations/absence_validation_test.rb`                        |     2 |    5 |     0 |
| `counter_cache_test.rb`                                         |     1 |    6 |     0 |
| `relation/where_clause_test.rb`                                 |     2 |    4 |     0 |
| `view_test.rb`                                                  |     0 |    6 |     0 |
| `connection_management_test.rb`                                 |     0 |    6 |     0 |
| `date_test.rb`                                                  |     3 |    3 |     0 |
| `defaults_test.rb`                                              |     2 |    4 |     0 |
| `relation/delegation_test.rb`                                   |     3 |    3 |     0 |
| `primary_class_test.rb`                                         |     0 |    6 |     0 |
| `encryption/message_serializer_test.rb`                         |     3 |    3 |     0 |
| `reserved_word_test.rb`                                         |     1 |    5 |     0 |
| `migration/references_foreign_key_test.rb`                      |     0 |    6 |     0 |
| `boolean_test.rb`                                               |     2 |    3 |     0 |
| `aggregations_test.rb`                                          |     1 |    4 |     0 |
| `encryption/uniqueness_validations_test.rb`                     |     0 |    5 |     0 |
| `migration/check_constraint_test.rb`                            |     0 |    5 |     0 |
| `comment_test.rb`                                               |     2 |    3 |     0 |

**106 divergences** (25 assertion-count, 80 assertion-kind, 1
assertion-value). Expand per test with `pnpm parity:test -- --package
activerecord --assertions --missing` and grep for the file; each line prints
`rails N vs trails M`. The trails counterparts are at the convention TS path
the same report prints beside the Ruby file.

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order (`assert_equal` → `toEqual`,
`assert_nil` → `toBeNull`, `assert_predicate`/`assert` → the mapped kind in
`scripts/test-compare/assertion-kinds.ts`). Where the port legitimately cannot
mirror an assertion — a Ruby-only value protocol, an async surface that needs
`await expect(...)` — say so at the call site in a comment; do not reword the
test name (CLAUDE.md: test names are the parity key).

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --package activerecord
--assertions`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly
  this story's contribution (the ratchet lowers on a passing run; do not
  hand-edit it upward).
- No test name changes; `pnpm parity:test` percent for activerecord does not
  drop.
- No new rows in `scripts/parity/unported-files/`.
