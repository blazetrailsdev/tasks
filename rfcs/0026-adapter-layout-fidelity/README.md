---
rfc: "0026-adapter-layout-fidelity"
title: "Adapter layout fidelity — adapter classes hold only what their Rails counterpart holds"
status: active
created: 2026-06-12
updated: 2026-06-12
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - adapter-layout
related-rfcs:
  - "0010-adapter-cleanup"
  - "0025-fidelity-verification-tooling"
---

# RFC 0026 — Adapter layout fidelity

## Summary

Rails keeps each concrete adapter class thin by mixing in per-database module
files (`postgresql/schema_statements.rb`, `mysql/schema_statements.rb`, …).
The trails port mirrors those module files on disk, but several of them are
**interface-only**: the implementations were written inline in the adapter
classes instead. This RFC moves those implementations into the mirrored module
files — pure code motion, no behavior change — so each adapter class holds only
what its Rails counterpart holds and file-structure parity holds across the
adapter tree.

## Motivation

Measured 2026-06-12 (code lines, comments/blanks excluded):

- `postgresql-adapter.ts` is 4,089 code lines vs Rails' 853 (**4.8×**).
  ~2,000 lines (the 2,671–4,443 block plus the exclusion/unique-constraint
  methods at ~4,845–5,200) are schema-management implementations that Rails
  keeps in `postgresql/schema_statements.rb`. The
  TS `postgresql/schema-statements.ts` is a declarations-only interface (all
  95 Rails method names are covered — nothing is missing, just mis-placed) and
  `postgresql/schema-statements-class.ts` holds only `dropTable`.
- `mysql2-adapter.ts` is 1,385 code lines vs Rails' 155 (**9×**). Same
  disease: `columns` (153 lines), `defaultPreparedStatements` (154), `indexes`
  (87), `foreignKeys` (58) and an inline `MysqlSchemaStatements` class sit in
  the adapter while `mysql/schema-statements.ts` is interface-only.
- `sqlite3-adapter.ts` is 2.9× but mostly faithful (Rails inlines the
  `alter_table`/`copy_table` rebuild family in the adapter too); only a thin
  introspection slice belongs in `sqlite3/schema-statements.ts`.

Oversized adapter classes are where layout drift accumulates: new methods get
added "where the neighbors are" instead of where Rails puts them, and
`api:compare` cannot flag the drift because the method names all exist.

## Design

For each adapter, move the inline implementations into the existing mirrored
module file (`*-schema-statements-class.ts` extending the abstract
`SchemaStatements`, or host-interface functions per the trails mixin
convention), leaving the adapter delegating. The already-written interfaces in
`postgresql/schema-statements.ts` / `mysql/schema-statements.ts` are the
contracts to satisfy. No behavior change; the existing test suite is the
safety net.

Code motion counts double against the 500 LOC PR ceiling (every moved line is
a deletion plus an addition), so stories are sized to ~200–250 moved lines
each: eight for the PG block, two for mysql2, one for sqlite3. Stories touching
the same files are dependency-chained and ship sequentially from `main` (no
stacking); if a group still exceeds the ceiling, the implementer ships the
slice that fits and registers the remainder with `pnpm tasks new`.

## Alternatives considered

- **Leave implementations inline; rely on `api:compare` name coverage.**
  Rejected — name coverage already passes while the layout drifts; the drift
  compounds as new methods follow the inline neighbors.
- **House these stories under RFC 0010 (adapter-cleanup).** Rejected — 0010's
  charter is the Adapter→Connection collapse, which is essentially finished;
  this is a distinct campaign with its own done-condition.

## Rollout

1. PostgreSQL extraction (chained) —
   `extract-pg-schema-statements-schemas-databases` →
   `extract-pg-schema-statements-tables-introspection` →
   `extract-pg-schema-statements-indexes` →
   `extract-pg-schema-statements-columns-types` →
   `extract-pg-schema-statements-alter-table` →
   `extract-pg-schema-statements-fks` →
   `extract-pg-schema-statements-constraints` →
   `extract-pg-schema-statements-enums-ranges-sequences`
2. MySQL extraction (chained) — `extract-mysql2-schema-introspection` →
   `extract-mysql2-schema-statements-class`
3. SQLite slice — `extract-sqlite3-schema-introspection`

## Open questions

1. **Class-based (`PostgreSQLSchemaStatements`) vs host-interface functions.**
   The class skeletons exist and mirror Rails' module-per-class shape;
   recommendation is class-based unless a method needs adapter-private state,
   in which case host-interface functions per CLAUDE.md.
2. ~~Where do `typeToSql` / `defaultPreparedStatements` belong?~~ Resolved
   against the Rails source: `type_to_sql` is in
   `postgresql/schema_statements.rb` (moves);
   `default_prepared_statements` is overridden in `mysql2_adapter.rb`
   (stays).

## Stories

<!-- generated: stories table -->

| ID                                                                                                                                            | Title                                                                                                | Status | Est LOC | Cluster        |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ------- | -------------- |
| [mysql-rename-column-issue-real-ddl](stories/mysql-rename-column-issue-real-ddl.md)                                                           | mysql-rename-column-issue-real-ddl                                                                   | ready  | null    | —              |
| [sqlite-uri-resolver-dedup-node-libsql](stories/sqlite-uri-resolver-dedup-node-libsql.md)                                                     | Dedup identical URI-aware resolveDatabasePath across node-sqlite and libsql drivers                  | ready  | 40      | —              |
| [addindexoptions-async-route-pg-addindex](stories/addindexoptions-async-route-pg-addindex.md)                                                 | Make addIndexOptions async and route PG addIndex through it                                          | done   | 120     | adapter-layout |
| [converge-pg-alter-table-clear-cache](stories/converge-pg-alter-table-clear-cache.md)                                                         | Converge PG alter-table methods to Rails (clear_cache!, validation, single-ALTER)                    | done   | 120     | adapter-layout |
| [converge-pg-build-change-column-definition-via-table-definition](stories/converge-pg-build-change-column-definition-via-table-definition.md) | Converge PG buildChangeColumnDefinition to route through createTableDefinition().newColumnDefinition | done   | 80      | —              |
| [extract-mysql2-indexes-introspection](stories/extract-mysql2-indexes-introspection.md)                                                       | Extract MySQL indexes introspection from mysql2-adapter into mysql/schema-statements                 | done   | 180     | adapter-layout |
| [extract-mysql2-schema-introspection](stories/extract-mysql2-schema-introspection.md)                                                         | Extract MySQL introspection statements from mysql2-adapter into mysql/schema-statements              | done   | 480     | adapter-layout |
| [extract-mysql2-schema-statements-class](stories/extract-mysql2-schema-statements-class.md)                                                   | Relocate inline MysqlSchemaStatements class and statement defaults out of mysql2-adapter             | done   | 400     | adapter-layout |
| [extract-pg-referential-integrity](stories/extract-pg-referential-integrity.md)                                                               | Extract PG disableReferentialIntegrity into its referential-integrity module                         | done   | 120     | adapter-layout |
| [extract-pg-schema-statements-alter-table](stories/extract-pg-schema-statements-alter-table.md)                                               | Extract PG alter-table statements into PostgreSQLSchemaStatements                                    | done   | 450     | adapter-layout |
| [extract-pg-schema-statements-columns-types](stories/extract-pg-schema-statements-columns-types.md)                                           | Extract PG column introspection and typeToSql into PostgreSQLSchemaStatements                        | done   | 480     | adapter-layout |
| [extract-pg-schema-statements-constraints](stories/extract-pg-schema-statements-constraints.md)                                               | Extract PG exclusion/unique-constraint statements into PostgreSQLSchemaStatements                    | done   | 420     | adapter-layout |
| [extract-pg-schema-statements-enums-ranges-sequences](stories/extract-pg-schema-statements-enums-ranges-sequences.md)                         | Extract PG enum/range/sequence statements into PostgreSQLSchemaStatements                            | done   | 450     | adapter-layout |
| [extract-pg-schema-statements-fks](stories/extract-pg-schema-statements-fks.md)                                                               | Extract PG foreign-key statements into PostgreSQLSchemaStatements                                    | done   | 480     | adapter-layout |
| [extract-pg-schema-statements-indexes](stories/extract-pg-schema-statements-indexes.md)                                                       | Extract PG index statements into PostgreSQLSchemaStatements                                          | done   | 480     | adapter-layout |
| [extract-pg-schema-statements-schemas-databases](stories/extract-pg-schema-statements-schemas-databases.md)                                   | Extract PG schema/database/session statements into PostgreSQLSchemaStatements                        | done   | 350     | adapter-layout |
| [extract-pg-schema-statements-sequences-primary-keys](stories/extract-pg-schema-statements-sequences-primary-keys.md)                         | Extract PG sequence/primary-key statements into PostgreSQLSchemaStatements                           | done   | 300     | —              |
| [extract-pg-schema-statements-tables-introspection](stories/extract-pg-schema-statements-tables-introspection.md)                             | Extract PG table/view introspection statements into PostgreSQLSchemaStatements                       | done   | 400     | adapter-layout |
| [extract-pg-schema-statements-tables-introspection-remainder](stories/extract-pg-schema-statements-tables-introspection-remainder.md)         | Extract remaining PG table/introspection statements into PostgreSQLSchemaStatements                  | done   | 300     | —              |
| [extract-pg-schema-statements-unique-constraints](stories/extract-pg-schema-statements-unique-constraints.md)                                 | Extract PG unique-constraint statements into PostgreSQLSchemaStatements                              | done   | 250     | —              |
| [extract-sqlite3-schema-introspection](stories/extract-sqlite3-schema-introspection.md)                                                       | Move SQLite schema-introspection slice from sqlite3-adapter into sqlite3/schema-statements           | done   | 300     | adapter-layout |
| [pg-addindex-return-void-harmonize](stories/pg-addindex-return-void-harmonize.md)                                                             | Harmonize PG addIndex return type Promise<string> -> Promise<void>                                   | done   | 60      | adapter-layout |
| [pg-dropschema-cascade-and-searchpath-memoization-fidelity](stories/pg-dropschema-cascade-and-searchpath-memoization-fidelity.md)             | pg-dropschema-cascade-and-searchpath-memoization-fidelity                                            | done   | null    | —              |
| [pg-indexes-rails-fidelity](stories/pg-indexes-rails-fidelity.md)                                                                             | Close PG indexes() / addIndex / renameIndex Rails-fidelity gaps                                      | done   | 120     | adapter-layout |
| [sqlite3-indexes-rails-fidelity](stories/sqlite3-indexes-rails-fidelity.md)                                                                   | Close SQLite3 indexes() fidelity gaps vs SQLite3::SchemaStatements#indexes                           | done   | 150     | adapter-layout |

## Changelog

- 2026-06-12: initial RFC; PG stories moved in from 0010-adapter-cleanup
- 2026-06-12: re-sized stories to respect the doubled diff cost of code motion (3 PG stories → 6; mysql2 → 2)
- 2026-06-12: resolved placement questions against Rails source (`type_to_sql` moves, `default_prepared_statements` stays); counted the ~4,845–5,200 constraint block, re-cut PG to 8 stories
