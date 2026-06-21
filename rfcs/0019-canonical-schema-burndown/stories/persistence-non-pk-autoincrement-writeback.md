---
title: "Restore test_populates_non_primary_key_autoincremented_column (non-PK auto-increment write-back)"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T20:54:43Z"
assignee: "persistence-non-pk-autoincrement-writeback"
blocked-by: null
---

## Context

Deferred from `persistence-port-residual-cluster` (RFC 0019). Restore
`test_populates_non_primary_key_autoincremented_column`
(`vendor/rails/activerecord/test/cases/persistence_test.rb:36`):
`TitlePrimaryKeyTopic.create!(title:)` must populate the non-PK
auto-increment `id` (`assert_not_nil topic.attributes["id"]`).

Root cause found while scoping the parent story: the live INSERT write-back
path is `Base#_performInsert` in `packages/activerecord/src/base.ts:3130-3200`
(NOT the unused `persistence.ts` `_createRecord`). It computes
`namedReturning` from `ctor.primaryKey` only — for `TitlePrimaryKeyTopic`
(`_primaryKey = "title"`) it emits `RETURNING "title"` and writes back only
`title` via `this._writeAttribute(ctor.primaryKey, insertedId)`. The
auto-increment `id` column is never read back, so it stays null. The inline
comment at base.ts:3180 already flags this: "A proper follow-up should
implement `_returningColumnsForInsert` and pass explicit returning column
names to execInsert so the result can be mapped by name."

Prerequisite groundwork (also needed by
`persistence-auto-populated-column-order`): SQLite `columns()`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1860`)
does not flag the integer single-column PK as the rowid, so
`isAutoIncrementedByDb()` is false and `returnValueAfterInsert()` is false.
Mirror Rails `SQLite3Adapter#is_column_the_rowid?`: pass `rowid: true` to
`Sqlite3Column` when `r.pk === 1 && pkCount === 1 && r.type` is `"integer"`.
PG/MySQL columns already override `isAutoIncrementedByDb` correctly.

## Acceptance criteria

- [ ] SQLite `columns()` flags the integer single-column PK as rowid
      (`isAutoIncrementedByDb()` → true), matching PG/MySQL.
- [ ] `Base#_performInsert` reads back ALL auto-populated columns (via
      `_returningColumnsForInsert`), not just the model PK, so a non-PK
      auto-increment column is populated after insert.
- [ ] Restore `test_populates_non_primary_key_autoincremented_column` verbatim
      in `packages/activerecord/src/persistence.test.ts` using the canonical
      `TitlePrimaryKeyTopic` model; real assertion, no stub.
- [ ] Passes on sqlite/postgres/mysql CI lanes; `pnpm lint` + typecheck clean.
