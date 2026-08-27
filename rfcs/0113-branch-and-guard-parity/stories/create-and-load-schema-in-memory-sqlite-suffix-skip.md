---
title: "Remove the invented :memory: suffix skip from create_and_load_schema"
status: ready
updated: 2026-08-27
rfc: "0113-branch-and-guard-parity"
cluster: invented-arm
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `TestDatabases.create_and_load_schema` suffixes every config's database
name unconditionally:

```ruby
ActiveRecord::Base.configurations.configs_for(env_name: env_name).each do |db_config|
  db_config._database = "#{db_config.database}-#{i}"
  ActiveRecord::Tasks::DatabaseTasks.reconstruct_from_schema(db_config, ActiveRecord.schema_format, nil)
end
```

(`vendor/rails/activerecord/lib/active_record/test_databases.rb:14-17`.)

trails' port (`packages/activerecord/src/test-databases.ts`) guards the
assignment with an `isInMemorySqlite(baseName)` check and skips suffixing
`:memory:`, because `SQLiteDatabaseTasks` special-cases `:memory:` (create/drop
are no-ops) and `":memory:-2"` would become an on-disk path. The skip is a
trails invention with no Rails counterpart; `isInMemorySqlite` is likewise
invented, and it deliberately matches only the bare `:memory:` name, not the
URI forms (`file::memory:?cache=shared`) that the same task layer does not
handle either.

PR #5381 converged the surrounding method (dropped the invented
empty-registry guard, routed the registry read through `Base.configurations`,
removed the vestigial `modelClass` parameter) but left this skip alone as
out of scope.

## Acceptance criteria

- Either the skip is deleted and the `:memory:` case is handled where Rails
  handles it (in the SQLite task layer / `DatabaseTasks`), so
  `create_and_load_schema` reads as the unconditional Rails loop; or the skip
  is justified at the call site with the Rails `file:line` showing why the
  parallel-worker path cannot reach it.
- `isInMemorySqlite` either disappears or moves next to the SQLite task-layer
  special-case it mirrors, rather than living in `test-databases.ts`.
- The existing `does not suffix in-memory SQLite databases` case in
  `test-databases.test.ts` is updated to whichever shape the above lands on.
- `pnpm typecheck`, `pnpm lint`, and the test-databases plus
  tasks/database-tasks suites pass.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0113-branch-and-guard-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
