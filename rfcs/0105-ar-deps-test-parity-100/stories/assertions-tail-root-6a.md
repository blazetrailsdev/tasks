---
title: "assertion parity tail: root files, batch 6a"
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
| `encryption/contexts_test.rb`                                   |     1 |    2 |     0 |
| `test_databases_test.rb`                                        |     2 |    1 |     0 |
| `unconnected_test.rb`                                           |     0 |    3 |     0 |
| `encryption/derived_secret_key_provider_test.rb`                |     0 |    3 |     0 |
| `encryption/encrypted_fixtures_test.rb`                         |     1 |    2 |     0 |
| `encryption/message_test.rb`                                    |     1 |    1 |     0 |
| `normalized_attribute_test.rb`                                  |     1 |    1 |     0 |
| `encryption/key_test.rb`                                        |     1 |    1 |     0 |
| `annotate_test.rb`                                              |     0 |    2 |     0 |
| `type/type_map_test.rb`                                         |     1 |    1 |     0 |
| `encryption/config_test.rb`                                     |     1 |    1 |     0 |
| `validations/i18n_validation_test.rb`                           |     2 |    0 |     0 |
| `errors_test.rb`                                                |     1 |    1 |     0 |
| `integration_test.rb`                                           |     0 |    2 |     0 |
| `touch_later_test.rb`                                           |     0 |    2 |     0 |
| `collection_cache_key_test.rb`                                  |     0 |    2 |     0 |
| `adapter_prevent_writes_test.rb`                                |     0 |    2 |     0 |
| `multi_db_migrator_test.rb`                                     |     0 |    1 |     1 |

**41 divergences** (12 assertion-count, 28 assertion-kind, 1
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
