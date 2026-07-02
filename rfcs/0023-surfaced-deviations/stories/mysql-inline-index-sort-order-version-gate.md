---
title: "Gate mysql inline-index sort-order DDL on supports_index_sort_order?"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing PR #4397 (MySQL/MariaDB index sort-order round-trip). The
mysql inline-index DDL path applies the `DESC`/`ASC` sort-order suffix
**unconditionally**, without the `supports_index_sort_order?` version gate that
Rails enforces.

- `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:340`
  `addOptionsForIndexColumns` — applies `order` directly with no version check.
- Called from
  `packages/activerecord/src/connection-adapters/mysql/schema-creation.ts:304`
  (`quotedColumns` → `visitIndexDefinition`), i.e. the `createTable` inline
  `t.index order:` / `SchemaCreation.accept(CreateIndexDefinition)` path.

Rails: `mysql/schema_statements.rb` `add_options_for_index_columns` adds only the
length prefix, then `super` → `abstract/schema_statements.rb`
`add_options_for_index_columns`, which gates the order suffix on
`if supports_index_sort_order?`. So MariaDB < 10.8.1 / MySQL < 8.0.1 silently
drop `DESC`/`ASC`. The trails ungated function emits `col DESC` on **any** MySQL
version.

Not caught by CI because the MariaDB lane is 11.8 (above threshold). PR #4397
already fixed the sibling `MigrationContext.addIndex` (reconstruct/`add_index`)
path to gate on `supportsIndexSortOrder()` (with a cold-lease
`getDatabaseVersion()` warm-up) — this is the same deviation on the
`SchemaCreation` visitor path, left unconverged.

## Acceptance criteria

- The mysql inline-index / `SchemaCreation` DDL path gates the sort-order suffix
  on `supports_index_sort_order?` (MariaDB ≥ 10.8.1 / MySQL ≥ 8.0.1), matching
  Rails and the `MigrationContext.addIndex` fix from PR #4397.
- Handle the cold-lease trap: `supportsIndexSortOrder()` reads `_databaseVersion`
  synchronously and yields false when unset; warm via `getDatabaseVersion()`
  before consulting it on this path too (memoized → no-op when warm).
- `addOptionsForIndexColumns` currently has no adapter handle; thread the gate in
  (pass a `sortOrderSupported` flag from the visitor, or move the gate to the
  caller) rather than plumbing the adapter into the pure helper.
- No regression on the CI MariaDB 11 lane (still emits order); add/adjust
  coverage that exercises the inline-`t.index order:` createTable path.
