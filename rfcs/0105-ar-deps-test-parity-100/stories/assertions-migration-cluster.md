---
title: "migration assertion parity"
status: done
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages:
  - "activerecord"
deps:
  - "port-migration-column-attributes-and-positioning"
  - "port-migration-constraints-and-residue"
  - "port-migration-create-join-table-test"
  - "port-migration-foreign-key-residue-and-mysql2-rake-skips"
  - "port-migration-index-test"
  - "port-migration-references-index-and-schema-definitions"
  - "port-migration-references-statements-test"
deps-rfc: []
est-loc: 348
priority: null
pr: 7261
claim: "2026-08-30T19:34:50Z"
assignee: "assertions-migration-cluster"
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
| `migration_test.rb`                                             |    46 |   73 |     0 |
| `migration/foreign_key_test.rb`                                 |     7 |   31 |     0 |
| `migration/change_schema_test.rb`                               |    11 |   14 |     0 |
| `migration/columns_test.rb`                                     |     3 |   11 |     0 |
| `migration/command_recorder_test.rb`                            |     5 |    6 |     0 |
| `migration/change_table_test.rb`                                |     4 |    4 |     0 |
| `migration/rename_table_test.rb`                                |     1 |    1 |     1 |

**218 divergences** (77 assertion-count, 140 assertion-kind, 1
assertion-value). Expand per test with `pnpm parity:test -- --package
activerecord --assertions --missing` and grep for the file; each line prints
`rails N vs trails M`. The trails counterparts are at the convention TS path
the same report prints beside the Ruby file.

Ordering: this cluster depends on every `port-migration-*` story, because those
stories are still _adding_ tests to the same Rails files. Burning down an
assertion table measured against a file that is still growing either wastes the
work or leaves the table stale — so the dep edges are real, not advisory.

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
