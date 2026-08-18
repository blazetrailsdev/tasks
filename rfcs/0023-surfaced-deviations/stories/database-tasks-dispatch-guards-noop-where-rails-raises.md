---
title: "create/drop/purge no-op where Rails raises NoMethodError"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into database-tasks-registry-holds-singletons-not-task-classes — the guards exist BECAUSE the @tasks registry holds singletons instead of classes; converting it to classes is what lets create/drop/purge send bare as Rails does (database_tasks.rb:117, 212, 349)"
---

## Context

Surfaced in #6487, which converged `database_adapter_for` onto Rails'
`klass.new(config, *arguments)` (`database_tasks.rb:566-572`) and the dispatch
sites onto Rails' bare no-arg sends.

Rails sends unconditionally. `create` is `database_adapter_for(db_config,
*arguments).create` (`:117`); `drop` is the same at `:212`; `purge` at `:349`;
`truncate_tables` reaches the pool, not a task method (`:387-395`). A task class
defining none of these answers `NoMethodError`, which propagates.

trails guards every one of them
(`packages/activerecord/src/tasks/database-tasks.ts`, in `create`, `drop`,
`purge`, `truncateAll` and `truncateTables`):

```ts
const handler = this.databaseAdapterFor(dbConfig);
if (handler.create) {
  await handler.create();
}
```

so a task class missing the method is silently a no-op — and `create` then goes
on to print its `Created database '...'` banner (`:119`) for a database it never
created. `charset` and `collation` already take the other arm and raise
`NoMethodError` by hand with Rails' message, which is the shape the rest should
match; `SqliteDBCollationTest#test_db_retrieves_collation`
(`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite_rake_test.rb:159-163`)
is the test that pins it.

The guards exist because `DatabaseTaskInstance`'s members are all optional —
TS has to model an absence Ruby gets for free — but "optional in the type" does
not have to mean "skipped at runtime".

## Converged shape

Each dispatch site raises `NoMethodError` with Rails' message when the
constructed task instance does not define the method, exactly as `charset` and
`collation` already do. `truncateAll` keeps its existing fallback only if that
fallback is itself Rails-backed; otherwise it is folded into the story that
tracks it (`database-tasks-truncate-all-handler-hook-is-an-invention`).

## Acceptance criteria

1. `create`, `drop` and `purge` raise `NoMethodError` for a task class that
   does not define the method, instead of no-opping and (for `create`) printing
   a success banner.
2. The message matches the one `charset` / `collation` already emit.
3. The `tasks/` suites stay green, and the banner tests still assert the
   banners for task classes that DO define the method.
