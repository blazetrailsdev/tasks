---
title: "SQLite alterTable uses a bespoke _alter_tmp_ buffer instead of Rails' two move_table copies"
status: in-progress
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 5527
claim: "2026-07-28T18:13:42Z"
assignee: "sqlite-alter-table-buffer-table-is-not-rails-two-move-copy"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `sqlite-alter-table-hand-rolls-fk-sql-instead-of-schema-creation`
(PR #5487), which routed the rebuilt table's DDL through `schemaCreation` but
left the copy strategy itself unconverged.

Rails' `alter_table` is two `move_table` calls
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:585-591`):
`move_table(table_name, "a#{table_name}", temporary: true)` then
`move_table("a#{table_name}", table_name, &caller)`. Each `move_table` is
`copy_table` + `drop_table` (`sqlite3_adapter.rb:593-596`), and `copy_table`
builds a full `TableDefinition` and calls `create_table`, so even the
throwaway "a"-prefixed table gets the complete definition.

trails instead builds a `_alter_tmp_<table>` buffer whose CREATE TABLE is
still hand-concatenated
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2554-2570`).
It carries the declared type verbatim but deliberately drops
NOT NULL / DEFAULT / CHECK / PK, with a comment explaining that rows come from
a table that already satisfied those. That is sound but is not Rails' shape,
and it leaves one hand-rolled DDL string in a method whose whole point is now
that it no longer has any.

Converging means reusing the definition-building code for both moves. Note
the wrinkle that kept it out of #5487: a typeless column (BLOB affinity) has
an empty declared type, and `visitColumnDefinition`'s `sqlType ??=` does not
treat `""` as absent, so the visitor emits the column name followed by a trailing space
where the current code emits a bare `"col"`. Decide whether that is
acceptable or whether the typeless case needs handling first — see
`sqlite-alter-table-typeless-column-affinity`.

## Acceptance criteria

- [ ] `alterTable` performs two `moveTable`/`copyTable` moves in Rails' shape
      rather than a bespoke `_alter_tmp_` buffer, or the deviation is
      documented at the call site with the reason converging is not viable.
- [ ] No hand-concatenated CREATE TABLE remains in `alterTable`.
- [ ] Typeless (BLOB-affinity) columns still round-trip their affinity.
- [ ] Green on all three adapters, in particular `sqlite3-copy-table.test.ts`,
      `adapters/sqlite3/`, `schema-dumper.test.ts`.
