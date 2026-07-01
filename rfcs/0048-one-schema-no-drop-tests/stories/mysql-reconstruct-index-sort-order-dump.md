---
title: "mysql-reconstruct-index-sort-order-dump"
status: ready
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `extend-defineschema-indexspec-and-converge-companies-index-dumps`
(PR #4377). That PR converged the six `companies` index-dump `SchemaDumperTest`
cases onto canonical `TEST_SCHEMA` and extended `IndexSpec` with
`order`/`length`/`nullsNotDistinct`/`using`/`type`.

On the MySQL/MariaDB adapter lane, the two sort-order-dependent assertions
(`schema dumps index sort order` → `index_companies_on_name_and_rating`, and
`schema dumps index columns in right order` → `company_index`) had to gate the
`order:` expectation off `adapterType !== "mysql"`
(`packages/activerecord/src/schema-dumper.test.ts`, `dumpsIndexSortOrder()`).

Rails asserts the descending order on MySQL 8.0.1+ / MariaDB 10.8.1+
(`supports_index_sort_order?`, `schema_dumper_test.rb`:170-211). trails' PG/SQLite
dumps surface it correctly, and the _direct_ `add_index` → dump path surfaces it
on MariaDB too (the pre-existing bespoke `users`/`name` sort-order test asserted
`order: "desc"` unconditionally and was green on MariaDB). But routing the
canonical `companies` indexes through the shared-worker _reconstruct_ path
(`generateSchemaFile` → `DatabaseTasks.loadSchema`/`reconstructFromSchema`,
`test-setup-dy.ts`) drops the descending order on MySQL/MariaDB — the reflected
`SHOW KEYS` `companies` index comes back with no `Collation = "D"`.

The generated schema file itself DOES emit the order
(`order: {"name":"desc","rating":"desc"}` — verified), so the loss is somewhere
between `loadSchema`/`reconstructFromSchema` running that `ctx.addIndex` on the
pooled MySQL connection and the index actually being stored/reflected as
descending. This mirrors the sqlite scalar-order drop the PR already worked
around by storing the order as a per-column map — but on MySQL even the map form
is dropped through this path.

## Acceptance criteria

- [ ] Descending index sort order round-trips through the MySQL/MariaDB
      shared-worker reconstruct path so canonical `companies` reflects
      `order: :desc` on `index_companies_on_name_and_rating` and
      `order: { rating: :desc }` on `company_index`.
- [ ] Flip `dumpsIndexSortOrder()` in `schema-dumper.test.ts` to the real
      `supports_index_sort_order?` predicate (version-gated) and drop the
      `adapterType !== "mysql"` workaround, matching Rails.
- [ ] No regression on PG/SQLite; test:compare non-negative.

## Notes

Root-cause candidates: the MySQL connected `add_index`/`buildCreateIndexDefinition`
path vs the direct-adapter one (the same divergence class that dropped scalar
order on sqlite), or a `loadSchema`/`reconstructFromSchema` DSL-replay gap on
MySQL. Needs a live MySQL/MariaDB to reproduce (not reproducible on the sqlite
dev lane).

**Ruled out (PR #4377, commit 58da2a018): cold `_databaseVersion` cache.** A
review hypothesis held that `SchemaStatements#addIndex` runs against a cold
version cache so `supportsIndexSortOrder()` silently returns `false` and drops
the order. Tested empirically: primed the cache with
`await this.adapter.getDatabaseVersion()` at the top of `addIndex` AND ungated
the dumper test to the live `supportsIndexSortOrder()` predicate — the MariaDB 11
CI lane still dumped `companies` with no order (both `company_index` and
`index_companies_on_name_and_rating`). This is expected: the MySQL order path
(`MysqlSchemaCreation` → the ungated mysql `addOptionsForIndexColumns`,
`mysql/schema-statements.ts:340-356`) never consults `supportsIndexSortOrder()`,
and reflection keys off `SHOW KEYS` `Collation = "D"`
(`mysql/schema-statements.ts:907`) — neither depends on the version. The
`getDatabaseVersion()` prime was kept as a harmless defensive fix; the test gate
(`dumpsIndexSortOrder()` → `adapterType !== "mysql"`) stays. Real cause is most
likely MariaDB not storing/reporting the descending `Collation` for a
reconstruct-created index — start there with a live MariaDB.

**Related pre-existing fidelity gap (PR #4377 review, not introduced here):**
trails' MySQL DDL emission
(`mysql/schema-creation.ts` `quotedColumns` → the standalone
`mysql/schema-statements.ts` `addOptionsForIndexColumns`, ~lines 340-356) appends
`ASC`/`DESC` UNCONDITIONALLY — it bypasses the generic version-gated
`SchemaStatements#addOptionsForIndexColumns` (`schema-statements.ts:2083-2092`)
that PG rides. Rails' `Mysql::SchemaStatements#add_options_for_index_columns`
(`mysql/schema_statements.rb:236`) instead calls `super`, landing on the abstract
version-gated impl (`abstract/schema_statements.rb:1639-1644`). So Rails is
version-gated on the MySQL DDL-emission side where trails' reimplementation isn't.
Moot in practice (an unsupported MySQL/MariaDB version ignores `DESC` in the DDL
itself, so reflection shows ascending either way), but a real fidelity gap in the
pre-existing `mysql/schema-creation.ts` worth converging if RFC 0048 tracks MySQL
index-emission fidelity.
