---
title: "trailties: port the remaining 20 multi_dbs_test.rb tests and their lib gaps"
status: ready
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trailties-test-rake-multi-dbs-part-1` / `-part-2` ported 53 of the 73 tests in
`vendor/rails/v8.0.5.2/railties/test/application/rake/multi_dbs_test.rb` into
`packages/trailties/test/application/rake/multi-dbs.test.ts`. The 20 below were
ported, run, and dropped from that PR for the LOC ceiling and lib gaps. The full
ported bodies of all 20 were written and can be re-derived from the Rails file
with the helpers already in the TS file (`dbCreateAndDropNamespace`,
`assertMatchNamespace`, `generateModelsForAnimals`, `tables`).

Failures observed (sqlite, 2026-11-23):

1. `db:create and db:drop works on all databases for env`,
   `db:create:namespace and db:drop:namespace works on specified databases`,
   `db:setup:namespace works` — output says `already exists` / no
   `Created database`. The sqlite files already exist: trailties'
   `toPrepare` schema-cache warm (`packages/trailties/lib/trailties/active-record.ts`,
   `warmSchemaCache`) opens a connection in non-test envs, and sqlite3's connect
   (`sqlite3_adapter.rb:115-120` mkdir + open) creates the file. Rails never
   connects at boot (`activerecord/lib/active_record/railtie.rb:145-185`). The
   warm must not create a database that does not exist yet.
2. The three `... sets the connection back to its original state` tests:
   a `foo` task appended to `Rakefile.ts`
   (`DSL.task({ foo: "environment" }, ...)`) is `Unrecognized command "foo"`.
   Find how the app Rakefile's own tasks reach `bin/trails`.
3. `schema_cache is loaded on all connection db ...` — runner code
   `ActiveRecord.Base.schemaCache.size()` is not a function; use the trails
   spelling of `schema_cache.size` (`schema_cache.rb` `size`).
4. `db:seed uses primary database connection` — Ruby `print` in seeds; ruby-compat
   `print` imported bare raises `this.write is not a function` (needs `$stdout`).
5. Five `db:create and db:drop don't raise errors when loading YAML ...` ERB tests:
   `config/database.ts` reading `Trails.application.config.database` raises
   `NoMethodError` because `setupInitialDatabaseYaml` loads it before the
   environment file. Rails survives through `DummyERB` (`railties/lib/rails/application/dummy_config.rb`,
   `configuration.rb#load_database_yaml`), which is YAML-only; these depend on
   `database-configuration-reads-config-database-yml`.
6. Three `when database_tasks is false ...` tests — same root cause as (1): the
   skipped database file exists after `generate`.
7. `each database can have its own schema_format`, `defaults to ruby schema_format`,
   `raises an exception for invalid schema formats` — `HashConfig#schema_format`
   (`activerecord/lib/active_record/database_configurations/hash_config.rb:161-165`)
   and every `db_config.schema_format` caller in `tasks/database_tasks.rb:376-485`
   and `railties/databases.rake:466-554` are unported (v8.0.5.2 bump rows in
   `scripts/parity/bump-ledger/rails.json`).
8. `after schema is loaded test run on the correct connections` — the
   `test/models/book.test.ts` written by the test is not a suite `trails test`
   finds ("No test suite found"); use the generated test file shape.

## Acceptance criteria

- [ ] All 20 tests ported with Rails names into `multi-dbs.test.ts` and passing.
- [ ] Lib fixes for (1), (2), (7) land (or are split into their own stories).
- [ ] No `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
