---
title: "sqlite-foreign-key-name-is-a-trails-invention"
status: draft
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter#foreign_keys` never sets `options[:name]`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:417-455`
— the options hash it builds carries only `on_delete`, `on_update`,
`deferrable`, `column` and `primary_key`). That is why
`ForeignKeyTest#test_schema_dumping_with_options`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:649-656`)
branches: the SQLite3 arm asserts a dump line with **no** `name:`, every other
adapter asserts one with `name: "fk_name"`.

trails' SQLite3 adapter synthesizes a name instead:
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1185,1201`
reads `_parseForeignKeyNames(tableName)` (defined at :1273) and falls back to a
constructed `fk_<table>_<columns>`. Neither the helper nor the fallback has a
Rails counterpart. As a result the schema dump on SQLite carries a `name:`
Rails would not emit, and the SQLite arm of that test cannot be ported.

Found while burning down `assertions-migration-cluster` (RFC 0105); that story
left `migration/foreign_key_test.rb` at **1 assertion-count and 1
assertion-kind mismatch** — this test — with a single-arm assertion, because
porting the Rails branch reds the SQLite lane.

## Acceptance criteria

- `SQLite3Adapter#foreignKeys` no longer attaches a name Rails does not
  attach; `_parseForeignKeyNames` and the `fk_<table>_<columns>` fallback are
  gone or justified against a Rails line.
- Any call site that relied on the synthesized name (e.g. `removeForeignKey`
  by name on SQLite) is converged onto what Rails does there.
- `migration/foreign_key_test.rb › schema dumping with options` carries both
  Rails adapter arms and `pnpm parity:test -- --package activerecord
--assertions` reports 0 mismatches for `migration/foreign_key_test.rb`.
- The SQLite AR lane is green.
