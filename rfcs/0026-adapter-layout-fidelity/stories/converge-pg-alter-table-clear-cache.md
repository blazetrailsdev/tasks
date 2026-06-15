---
title: "Converge PG alter-table methods to Rails (clear_cache!, validation, single-ALTER)"
status: draft
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
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

## Acceptance criteria

- [ ] Converge each method to Rails behavior (or document a tracked-pending
      deviation with rationale if a behavior genuinely cannot match).
- [ ] Once (6) is resolved, move `buildChangeColumnDefaultDefinition` into
      `PostgreSQLSchemaStatements`.
- [ ] CI green on all three adapters.
