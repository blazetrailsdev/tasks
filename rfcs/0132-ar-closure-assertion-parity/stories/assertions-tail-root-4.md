---
title: "assertion parity tail: root files, batch 4"
status: ready
updated: 2026-08-13
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 302
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
| `cache_key_test.rb`                                             |     5 |    6 |     0 |
| `callbacks_test.rb`                                             |     3 |    8 |     0 |
| `encryption/extended_deterministic_queries_test.rb`             |     1 |   10 |     0 |
| `explain_test.rb`                                               |     0 |   11 |     0 |
| `excluding_test.rb`                                             |     7 |    4 |     0 |
| `dup_test.rb`                                                   |     0 |   11 |     0 |
| `relation/update_all_test.rb`                                   |     3 |    7 |     0 |
| `relation/or_test.rb`                                           |     4 |    6 |     0 |
| `core_test.rb`                                                  |     3 |    7 |     0 |
| `migrator_test.rb`                                              |     3 |    6 |     1 |
| `base_prevent_writes_test.rb`                                   |     3 |    7 |     0 |
| `database_configurations/resolver_test.rb`                      |     0 |    9 |     0 |
| `migration/exclusion_constraint_test.rb`                        |     4 |    4 |     0 |
| `assertions/query_assertions_test.rb`                           |     4 |    4 |     0 |
| `multiple_db_test.rb`                                           |     2 |    6 |     0 |
| `relation/select_test.rb`                                       |     4 |    4 |     0 |
| `encryption/cipher/aes256_gcm_test.rb`                          |     3 |    5 |     0 |
| `relation/delete_all_test.rb`                                   |     2 |    6 |     0 |
| `delegated_type_test.rb`                                        |     1 |    7 |     0 |
| `bind_parameter_test.rb`                                        |     2 |    6 |     0 |

**189 divergences** (54 assertion-count, 134 assertion-kind, 1
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
