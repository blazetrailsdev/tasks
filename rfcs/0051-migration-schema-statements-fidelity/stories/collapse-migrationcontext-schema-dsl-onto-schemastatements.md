---
title: "Collapse MigrationContext bespoke schema-DSL onto SchemaStatements (single source of truth, Rails-faithful)"
status: done
updated: 2026-07-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 450
priority: 12
pr: 4699
claim: "2026-07-06T20:23:55Z"
assignee: "collapse-migrationcontext-schema-dsl-onto-schemastatements"
blocked-by: null
---

## Context

Surfaced while fixing `expression-index-name-stable-across-schema-reload`
(PR #3521). trails has **two** parallel schema-DSL implementations, where Rails
has one:

- `Migration.addIndex` (packages/activerecord/src/migration.ts:682) delegates
  to the real adapter path: `await this.schema.addIndex(...)` →
  `SchemaStatements.addIndexOptions` → `schema_creation`.
- `MigrationContext.addIndex` (packages/activerecord/src/migration.ts:2312) is a
  bespoke standalone reimplementation: it builds the `CREATE INDEX` SQL string
  itself, executes it via `this.connection.executeMutation`, and tracks schema
  state in private in-memory Maps (`_tables`, `_columns`, `_indexes`).
  `MigrationContext` (constructor at migration.ts:1728,
  `constructor(private connection: DatabaseAdapter)`) similarly reimplements
  `createTable`, `addColumn`, and introspection (its own `PRAGMA table_info` /
  `information_schema` queries) instead of routing through the connection's
  `SchemaStatements`.

The `DatabaseTasks.loadSchema` path
(packages/activerecord/src/tasks/database-tasks.ts:877 — `new
MigrationContext(adapter)` then run the generated schema file) drives this
second copy. Because the index-name derivation was duplicated here, it drifted:
`MigrationContext.addIndex` named an expression index from its raw parenthesised
SQL (`index_books_on_(lower(external_id))`) instead of the Rails-default
stripped name (`index_books_on_lower_external_id`). PR #3521 fixed _that one
divergence_ by re-deriving the name the Rails way, but the underlying duplicate
engine remains — any future schema-DSL behavior must be implemented twice and
can drift again.

### Rails structure (the target)

Rails has a single source of truth:

- `SchemaStatements#add_index` → `add_index_options` →
  `schema_creation.accept(CreateIndexDefinition)`
  (activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1476).
- Rails `MigrationContext`
  (activerecord/lib/active_record/migration.rb:1211) is **only** the
  migrations-directory runner (`migrate`, `rollback`, `current_version`,
  `needs_migration?`) — it has **no** `add_index` / `create_table`.
- Rails `Migration` exposes `create_table` / `add_index` but `method_missing`-
  forwards them to the connection adapter's `SchemaStatements`.

So Rails' `MigrationContext` never touches the schema DSL; trails' has been
overloaded to also be a schema-DSL + introspection host. That overloading is the
structural root cause of the "two code paths drift apart" class of bug.

## Acceptance criteria

- [ ] `MigrationContext`'s schema-DSL methods (`addIndex`, `createTable`,
      `addColumn`, and the other DDL builders) delegate to the connection's real
      `SchemaStatements` instead of reimplementing SQL generation, so there is a
      single source of truth as in Rails.
- [ ] `MigrationContext`'s bespoke introspection (`PRAGMA table_info` /
      `information_schema` queries, in-memory `_tables`/`_columns`/`_indexes`
      tracking) is replaced by / backed by the adapter's real schema
      introspection where feasible, or the divergence is documented with a
      tracked reason if any part genuinely cannot delegate.
- [ ] The `loadSchema` generated-schema-file path
      (test-helpers/schema-file-generator.ts → DatabaseTasks.loadSchema) still
      builds the canonical worker DB identically; expression-index names remain
      stable (the PR #3521 invariant), now structurally rather than by a
      duplicated name derivation.
- [ ] No regression in api:compare / test:compare (non-negative delta).

## Notes

- Larger than one 500-LOC PR is likely; if so, split into non-overlapping PRs
  from `main` (no stacked PRs), e.g. one DSL method group at a time, each
  collapsing one bespoke builder onto `SchemaStatements`.
- This is a fidelity convergence, not a ratification: converge toward the Rails
  single-source-of-truth structure.
