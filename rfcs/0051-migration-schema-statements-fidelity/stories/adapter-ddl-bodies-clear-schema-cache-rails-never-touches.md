---
title: "adapter-ddl-bodies-clear-schema-cache-rails-never-touches"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6171
claim: "2026-08-07T13:08:28Z"
assignee: "adapter-ddl-bodies-clear-schema-cache-rails-never-touches"
blocked-by: null
closed-reason: null
---

## Context

Split out of `abstract-ddl-bodies-clear-schema-cache-rails-never-touches`
(PR for that story converged the abstract layer only, per its own
"split by adapter layer" note).

Rails calls `schema_cache.clear_data_source_cache!` from exactly six places,
and nowhere else:

- `abstract/schema_statements.rb:306` — `create_table`, non-force arm
- `abstract/schema_statements.rb:542` — `drop_table`
- `abstract_mysql_adapter.rb:333-334` — `rename_table` (both names)
- `abstract_mysql_adapter.rb:355` — `drop_table`
- `sqlite3_adapter.rb:332-333` — `rename_table` (both names)
- `postgresql/schema_statements.rb:58` — `drop_table`
- `postgresql/schema_statements.rb:437-438` — `rename_table` (both names)

(Verified with `grep -rn clear_data_source_cache vendor/rails/activerecord/lib/active_record/connection_adapters/`.)

trails carries adapter-level copies at DDL sites Rails does NOT clear from:

- `connection-adapters/abstract-mysql-adapter.ts:756` (`changeColumnDefault`)
- `connection-adapters/abstract-mysql-adapter.ts:911` (`renameColumn`)
- `connection-adapters/sqlite3-adapter.ts:1703` (`changeColumnDefault`)
- `connection-adapters/sqlite3-adapter.ts:1748` (`renameColumn`)
- `connection-adapters/postgresql-adapter.ts:3806` (`renameIndex`)
- `connection-adapters/postgresql-adapter.ts:3938` (`addIndex`)
- `connection-adapters/mysql/schema-statements.ts:134`
- `connection-adapters/mysql2-adapter.ts:1390`
- `connection-adapters/postgresql/schema-statements-class.ts:895,906,922`

(The line numbers for the last three groups were read off `main` before the
abstract-layer PR; re-confirm the enclosing method before deleting — a couple
sit inside helper closures rather than the DDL method itself.)

Each call is also an `await` inside a body Rails runs synchronously, so it
changes the interleaving of the DDL method as well as the cache state.

Note the parent story's acceptance criterion "no clearDataSourceCacheBang in
abstract/schema-statements.ts" was written from a mistaken premise — Rails has
two there (`:306`, `:542`) and trails' matching pair at
`abstract/schema-statements.ts:410,479` is converged and must stay.

## Acceptance criteria

- [ ] The only `clearDataSourceCacheBang` calls left in
      `packages/activerecord/src/connection-adapters/` are the six that mirror
      the Rails sites listed above (`create_table`/`drop_table` in abstract,
      `drop_table` + `rename_table` per adapter).
- [ ] Each affected body matches its Rails counterpart line for line.
- [ ] Tests in `schema-cache.test.ts` ("SchemaCache DDL invalidation" describe)
      that pin the trails-only clears are deleted or re-pointed; check each one
      actually observes the call it names before assuming it must go.
- [ ] All three adapter lanes green.
