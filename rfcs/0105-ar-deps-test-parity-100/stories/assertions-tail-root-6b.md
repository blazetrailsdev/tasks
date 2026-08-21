---
title: "assertion parity tail: root files, batch 6b"
status: claimed
updated: 2026-08-21
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: "2026-08-21T23:10:30Z"
assignee: "assertions-tail-root-6a"
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
| `log_subscriber_test.rb`                                        |     1 |    1 |     0 |
| `relation/predicate_builder_test.rb`                            |     1 |    1 |     0 |
| `relation/with_test.rb`                                         |     0 |    1 |     0 |
| `statement_cache_test.rb`                                       |     0 |    1 |     0 |
| `relation/field_ordered_values_test.rb`                         |     0 |    1 |     0 |
| `type/string_test.rb`                                           |     0 |    1 |     0 |
| `table_metadata_test.rb`                                        |     0 |    1 |     0 |
| `mixin_test.rb`                                                 |     0 |    1 |     0 |
| `active_record_test.rb`                                         |     0 |    1 |     0 |
| `filter_attributes_test.rb`                                     |     0 |    0 |     1 |
| `binary_test.rb`                                                |     0 |    1 |     0 |
| `forbidden_attributes_protection_test.rb`                       |     0 |    1 |     0 |
| `encryption/null_encryptor_test.rb`                             |     0 |    1 |     0 |
| `database_configurations/url_config_test.rb`                    |     0 |    1 |     0 |
| `type_caster/connection_test.rb`                                |     0 |    1 |     0 |
| `serialization_test.rb`                                         |     0 |    1 |     0 |
| `query_logs_test.rb`                                            |     0 |    1 |     0 |

**19 divergences** (2 assertion-count, 16 assertion-kind, 1
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
