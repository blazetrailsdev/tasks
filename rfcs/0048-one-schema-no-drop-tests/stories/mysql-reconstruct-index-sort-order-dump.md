---
title: "mysql-reconstruct-index-sort-order-dump"
status: done
updated: 2026-07-04
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4397
claim: "2026-07-04T22:47:10Z"
assignee: "mysql-reconstruct-index-sort-order-dump"
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
