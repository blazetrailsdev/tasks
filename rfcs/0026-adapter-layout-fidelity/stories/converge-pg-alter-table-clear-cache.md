---
title: "Converge PG alter-table methods to Rails (clear_cache!, validation, single-ALTER)"
status: done
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3354
claim: "2026-06-15T14:28:29Z"
assignee: "converge-pg-alter-table-clear-cache"
blocked-by: null
---

## Context

Surfaced during code motion in #3314 (extract-pg-schema-statements-alter-table).
The PG alter-table methods now in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
carry pre-existing deviations from Rails'
`postgresql/schema_statements.rb` (the motion preserved them faithfully —
they were not introduced by #3314):

1. `renameColumn` — Rails calls `clear_cache!` then `rename_column_indexes`
   after the `ALTER TABLE ... RENAME COLUMN`. TS does neither.
2. `changeColumnComment` / `changeTableComment` — Rails calls `clear_cache!`
   before issuing the `COMMENT ON` statement. TS does not.
3. `changeColumnNull` — Rails calls `validate_change_column_null_argument!(null)`
   and `clear_cache!`. TS does neither.
4. `changeColumn` — Rails partitions `change_column_for_alter` into SQL
   clauses + procs and issues a single `ALTER TABLE` with comma-joined
   clauses, then runs the procs. TS issues separate `ALTER TABLE`
   statements for TYPE, DEFAULT, and NOT NULL.
5. `createJoinTable` — Rails' PostgreSQL adapter does NOT override
   `create_join_table`; it inherits the abstract one (which uses
   `find_join_table_name`). TS has a PG override using `deriveJoinTableName`.
6. `buildChangeColumnDefaultDefinition` could not move into
   `PostgreSQLSchemaStatements` in #3314: its
   `Promise<ChangeColumnDefaultDefinition | undefined>` return type is
   incompatible with the abstract base method's `AlterTable` return, which
   surfaces as a TS override error only in a real subclass. It remains on
   the adapter. Resolving may require widening the base signature.
7. `addColumn` — Rails `PostgreSQL#add_column`
   (`postgresql/schema_statements.rb:460-464`) calls `clear_cache!` before
   `super`. The moved TS override goes straight to `super.addColumn(...)`
   without `this.pg.clearCacheBang()` (same missing-`clear_cache!` class as
   items 1–3).
8. `changeColumnComment` / `changeTableComment` skip the `{from:, to:}`
   hash-unwrap Rails does via `extract_new_comment_value`
   (`abstract/schema_statements.rb:1820-1827`): the TS signatures narrow the
   argument to `string | null`. (Convergence companion to item 2.)
9. `changeColumnNull` guards the pre-`ALTER` `UPDATE` with `if column` in
   Rails (`postgresql/schema_statements.rb:503`); the TS calls
   `quoteDefaultExpression(defaultValue, col)` unconditionally even when `col`
   is `undefined`. (Convergence companion to item 3.)

Note: #3314 already converged the moved DDL methods to route through
`executeMutation` (query-cache clearing) and added
`createTableDefinition`/`createAlterTable` overrides (PG column
normalization) — those are done, not part of this story.

## Acceptance criteria

- [ ] Converge each method to Rails behavior (or document a tracked-pending
      deviation with rationale if a behavior genuinely cannot match).
- [ ] Once (6) is resolved, move `buildChangeColumnDefaultDefinition` into
      `PostgreSQLSchemaStatements`.
- [ ] CI green on all three adapters.
