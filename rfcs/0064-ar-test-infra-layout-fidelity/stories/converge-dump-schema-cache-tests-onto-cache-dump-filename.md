---
title: "Converge DumpSchemaCache tests onto cacheDumpFilename"
status: done
updated: 2026-08-04
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 6
pr: 6089
claim: "2026-08-04T20:32:03Z"
assignee: "i18n-date-parse-day-sets-wday"
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasksDumpSchemaCacheTest` in
`packages/activerecord/src/tasks/database-tasks.test.ts:205-224` ports five
Rails tests by name (`cache dump default filename`, `... with custom db dir`,
`cache dump alternate filename`, `cache dump filename with path from db
config`, `cache dump filename with path from the argument has precedence`) but
every one of them calls `DatabaseTasks.dumpSchemaFilename`
(`database-tasks.ts:514`) instead of `DatabaseTasks.cacheDumpFilename`
(`database-tasks.ts:650`).

Rails' counterparts all call `cache_dump_filename`
(`vendor/rails/activerecord/test/cases/tasks/database_tasks_test.rb:315-359`)
and assert `schema_cache.yml`-shaped paths, not `schema.rb` ones:

- `:315` `test_cache_dump_default_filename` -> `db/schema_cache.yml`
- `:324` `..._with_custom_db_dir` -> `my_db/schema_cache.yml`
- `:333` `test_cache_dump_alternate_filename` -> `db/alternate_schema_cache.yml`
  (note: driven by the `HashConfig` name `alternate`, NOT by `ENV["SCHEMA"]`,
  which the trails test currently uses)
- `:342` `..._with_path_from_db_config` -> config's `schema_cache_path:
"tmp/something.yml"`
- `:352` `..._with_path_from_the_argument_has_precedence` -> passes an explicit
  second argument, `cache_dump_filename(config, schema_cache_path:
"tmp/another.yml")`, and asserts the argument beats the config's own
  `schema_cache_path`

The assertions pass today only because `dumpSchemaFilename`'s
`config.name !== "primary"` branch happens to produce a same-shaped string.
`cacheDumpFilename` is never exercised anywhere in the file. Found in review of
PR #5724, which converged the `HashConfig` names in this describe but left the
method call untouched (out of that story's scope).

## Acceptance criteria

- All five tests in `DatabaseTasksDumpSchemaCacheTest` call
  `DatabaseTasks.cacheDumpFilename`, with expected paths converged onto Rails'
  `schema_cache.yml` shape.
- `cache dump alternate filename` drives the alternate path off the
  `HashConfig` name (`alternate`), not `process.env.SCHEMA`.
- `cache dump filename with path from the argument has precedence` passes the
  explicit `{ schemaCachePath }` second argument and asserts it beats a
  `schemaCachePath` set on the config itself.
- Test names unchanged; `parity:test` for `tasks/database_tasks_test.rb` stays
  at 77/77; a run of the file leaves `git status` clean.
