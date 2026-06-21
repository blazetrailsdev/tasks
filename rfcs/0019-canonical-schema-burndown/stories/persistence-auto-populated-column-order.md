---
title: "Restore test_populates_autoincremented_id_pk_regardless_of_its_position (positioned PK + auto_populated reflection)"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3833
claim: "2026-06-21T20:38:44Z"
assignee: "persistence-auto-populated-column-order"
blocked-by: null
---

## Context

Deferred from `persistence-port-residual-cluster` (RFC 0019). Restore
`test_populates_autoincremented_id_pk_regardless_of_its_position_in_columns_list`
(`vendor/rails/activerecord/test/cases/persistence_test.rb:42`):
`AutoId.columns.select(&:auto_populated?)` must have `size > 1` AND its first
element must NOT be the PK.

Rails schema (`vendor/rails/activerecord/test/schema/schema.rb:107`,
`create_table :auto_id_tests, id: false`) orders columns `value`,
`published_at` (`default: -> { "CURRENT_TIMESTAMP" }`), then `t.primary_key
:auto_id` LAST — so the first auto-populated column is `published_at`, not the
`auto_id` PK.

Findings while scoping the parent story:

- The canonical `auto_id_tests` schema
  (`packages/activerecord/src/test-helpers/test-schema.ts:125`) lists `auto_id`
  first and gives `published_at` no default function.
- Even after reordering the schema object to `value, published_at, auto_id` and
  adding `defaultFunction: "CURRENT_TIMESTAMP"` to `published_at`, the table
  builder hoists the PK column FIRST: `define-schema.ts:700-718` emits a
  single-column integer PK via `createTable`'s string-`primaryKey` option (which
  places the column first) and `continue`s past it in the column loop. So the
  reflected order is `auto_id, value, published_at` and the test's
  `first != primary_key` assertion fails.
- Needs `rowid` reflection in SQLite `columns()` (see sibling story
  `persistence-non-pk-autoincrement-writeback`) so `auto_id` reports
  `auto_populated?` via rowid and `published_at` via its default function.

Real work: teach `define-schema.ts` to emit a positioned primary key (Rails
`t.primary_key :col` at its declared position) so the PK column is created at
its schema-declared offset, preserving auto-increment across sqlite (rowid),
PG (serial), and MySQL (auto_increment). Then register an `autoIdTests` fixture
set (`fixtures-registry.ts`) backed by the `AutoId` canonical model so the
table is created/reflected, and reorder `auto_id_tests` in `test-schema.ts`.

## Acceptance criteria

- [ ] `define-schema` supports a positioned single-column integer PK that keeps
      auto-increment on all three adapters and is reflected at its declared
      column offset.
- [ ] `auto_id_tests` canonical schema mirrors Rails order
      (`value, published_at, auto_id`) with `published_at` default
      `CURRENT_TIMESTAMP`.
- [ ] `autoIdTests` registered in `fixtures-registry.ts` (AutoId model).
- [ ] Restore the test verbatim in `persistence.test.ts`; real assertions.
- [ ] Passes on sqlite/postgres/mysql CI lanes; lint + typecheck clean.
