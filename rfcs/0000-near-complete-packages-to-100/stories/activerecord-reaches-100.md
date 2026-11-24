---
title: "activerecord: reach 100% on parity"
status: ready
rfc: "0000-near-complete-packages-to-100"
cluster: rails-core
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured 2026-11-24 at trails `4330f807e1`: `activerecord` is 39 tests short of
100%. 4 of those are skips without a `PERMANENT-SKIP:` line (list them with
`pnpm parity:test -- --package activerecord` and grep the TS files for
`it.skip`). The rest are missing. Paths are under `vendor/rails/v8.0.5.2/`:

- `activerecord/test/cases/relations_test.rb` (activerecord):
  - create or find by rollbacks a transaction
  - create or find by bang rollbacks a transaction
  - create or find by on a collections rollbacks a transaction when owner is not persisted
- `activerecord/test/cases/associations/belongs_to_associations_test.rb` (activerecord):
  - clearing optional cpk belongs to should preserve shared pk
  - should reload association on model with query constraints when foreign key changes
  - polymorphic stale state handles nil foreign keys correctly
- `activerecord/test/cases/fixtures_test.rb` (activerecord):
  - supports inline habtm
- `activerecord/test/cases/associations_test.rb` (activerecord):
  - preload group with klass
- `activerecord/test/cases/attribute_methods_test.rb` (activerecord):
  - #id_value alias is not defined if id_value column exist
  - #id_value returns the value in the id_value column, when id_value column exists
- `activerecord/test/cases/migration_test.rb` (activerecord):
  - bulk revert with table name prefix
- `activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb` (activerecord):
  - rowid changes column equality
  - generated type changes column equality
  - alter table with fk preserves rows when referenced table altered
  - alter table with fk preserves rows when adding fk to referenced table
  - alter table with multiple cascade fks preserves all data
  - rename table with cascade fk preserves referencing data
- `activerecord/test/cases/adapter_test.rb` (activerecord):
  - disconnect and recover on #configure_connection timeout
- `activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb` (activerecord):
  - reconnect after bad connection on check version with native exception
  - schema search path is reapplied after reconnect
  - schema search path is reapplied after reset
- `activerecord/test/cases/strict_loading_test.rb` (activerecord):
  - does not raise when checking if new record included in eager loaded habtm relation
- `activerecord/test/cases/relation_test.rb` (activerecord):
  - relation with annotation includes comment in update all query
  - relation with annotation includes comment in delete all query
- `activerecord/test/cases/connection_pool_test.rb` (activerecord):
  - checkout callback error does not affect permanent lease and active connection state
- `activerecord/test/cases/adapters/postgresql/postgresql_rake_test.rb` (activerecord):
  - structure dump header comments with restrict commands removed
- `activerecord/test/cases/relation/load_async_test.rb` (activerecord):
  - execute or skip does not contaminate caller thread instrumenter
- `activerecord/test/cases/relation/merging_test.rb` (activerecord):
  - merging where relation having arel equality with null relation
- `activerecord/test/cases/relation/where_clause_test.rb` (activerecord):
  - merge with or/and correctly handles SQL literals and attributes
- `activerecord/test/cases/adapters/sqlite3/virtual_column_test.rb` (activerecord):
  - virtual column does not deduplicate with regular column
- `activerecord/test/cases/adapters/postgresql/virtual_column_test.rb` (activerecord):
  - virtual column does not deduplicate with regular column
- `activerecord/test/cases/connection_adapters/connection_swapping_nested_test.rb` (activerecord):
  - shard swapping prohibition exception recovery
- `activerecord/test/cases/database_statements_test.rb` (activerecord):
  - extract table ref from insert sql with hyphen in table name
- `activerecord/test/cases/adapters/sqlite3/virtual_table_test.rb` (activerecord):
  - schema dump ignores virtual tables in ignore tables
  - virtual table regex matches empty parentheses

API: 18 members short of 100% on trailmap. List them with `pnpm parity:api --missing --package activerecord`.

Apply the triage rule in this RFC's README (§ "Triage rule"). Every item ends
ported, permanent with a citation, listed for an operator ruling, or filed as a
blocking story. Before calling an item permanent, try to disprove its
receipt.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for `activerecord`.
- [ ] `methodsMissing` is 0 for `activerecord` in `package-summary.json` (`pnpm parity:packages`).
- [ ] Every remaining `it.skip` in the package sits under a `PERMANENT-SKIP:`
      line citing a CLAUDE.md section or a dated operator ruling.
- [ ] Items needing a ruling are listed in the PR body with their Rails
      `file:line`, and are not receipted until the operator rules.
- [ ] Work past the LOC ceiling is filed as new stories in this RFC, each
      with a `deps` edge from this one.

## Verification

```sh
pnpm parity:test -- --package activerecord
pnpm parity:api --missing --package activerecord
pnpm parity:packages
```
