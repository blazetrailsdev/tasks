---
title: "instrument-sqlite-alter-table-rebuild-queries"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
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

trails' SQLite `alterTable` rebuild
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2391`) issues
its PRAGMA reads, `CREATE TABLE`, `INSERT … SELECT`, `DROP TABLE` and index
recreation straight through `this.driver.prepare(...)`, bypassing the adapter's
instrumented execution path. No `sql.active_record` notification is emitted for
any of it.

Consequence: every `assert_queries_match` / `assert_queries_count` around a
SQLite DDL change silently sees an empty query log, so such assertions are
either no-ops or have to be rewritten per adapter. Surfaced on #5486, where
Rails' `test_deferrable_foreign_key`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:537-547`)
asserts

```ruby
assert_queries_match(/\("id"\)\s+DEFERRABLE INITIALLY IMMEDIATE\W*\z/i) do
  @connection.add_foreign_key :astronauts, :rockets, column: "rocket_id", deferrable: :immediate
end
```

and on SQLite the counter logged only `PRAGMA table_xinfo`,
`PRAGMA foreign_key_list`, `BEGIN IMMEDIATE TRANSACTION`, `COMMIT TRANSACTION`.
The ported case had to branch on `adapterType === "sqlite"` and assert the
clause against `sqlite_master.sql` instead
(`packages/activerecord/src/migration/foreign-key.test.ts`, "deferrable foreign
key"). Rails has no such branch — its `copy_table` runs through `execute`, so
the rebuild statements are instrumented like any other.

## Acceptance criteria

- [ ] The SQLite `alterTable` rebuild runs its statements through the adapter's
      instrumented execution path, so they appear in `sql.active_record`
      notifications like Rails' `copy_table`.
- [ ] The adapter branch in `foreign-key.test.ts`'s "deferrable foreign key" is
      removed and the single `assertQueriesMatch` form runs on every adapter.
- [ ] A regression assertion fails on baseline.
- [ ] Green on all three adapters.
