---
title: "assertion parity tail: root files, batch 3"
status: ready
updated: 2026-08-13
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 289
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
| `database_configurations_test.rb`                               |     6 |   11 |     1 |
| `relation/where_test.rb`                                        |     5 |   11 |     0 |
| `encryption/encryption_schemes_test.rb`                         |     6 |   10 |     0 |
| `database_configurations/hash_config_test.rb`                   |     2 |    3 |    11 |
| `timestamp_test.rb`                                             |     1 |   13 |     0 |
| `finder_respond_to_test.rb`                                     |     5 |    9 |     0 |
| `type/adapter_specific_registry_test.rb`                        |     3 |   10 |     0 |
| `quoting_test.rb`                                               |     5 |    7 |     1 |
| `connection_handling_test.rb`                                   |     4 |    9 |     0 |
| `date_time_test.rb`                                             |     6 |    6 |     0 |
| `unsafe_raw_sql_test.rb`                                        |     0 |   12 |     0 |
| `reaper_test.rb`                                                |     5 |    7 |     0 |
| `migration/unique_constraint_test.rb`                           |     5 |    7 |     0 |

**181 divergences** (53 assertion-count, 115 assertion-kind, 13
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
