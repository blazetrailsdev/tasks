---
title: "generated-app-first-test-run-races-maintain-test-schema-across-workers"
status: claimed
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-09-30T16:55:17Z"
assignee: "generated-app-first-test-run-races-maintain-test-schema-across-workers"
blocked-by: null
closed-reason: null
---

## Context

Found while verifying trails#8281. On a fresh `trails new blog` + `generate scaffold Post title:string body:text` +
`db migrate`, the first `pnpm test` (with `storage/test.sqlite3` absent) fails every time (3/3):

```text
FAIL  test/models/post.test.ts
ActiveRecord::StatementInvalid: SQLite3::SQLException: table "posts" already exists
```

Sometimes `test/controllers/posts-controller.test.ts` fails with the same error instead, or both
files fail. `pnpm vitest run --no-file-parallelism` on a fresh DB passes, and so does every run
after the first.

Cause: every generated test file imports `test/test-helper.ts`, which imports trails' `test_help`.
That runs `ActiveRecord::Migration.maintain_test_schema!` (`vendor/rails/v8.0.2/railties/lib/rails/testing/maintain_test_schema.rb:5`,
trails `packages/activerecord/src/migration.ts:1135` `maintainTestSchemaBang`). That calls
`load_schema_if_pending!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:709-715`). vitest runs each
file in its own worker, so N workers each see `any_schema_needs_update?` true against the same
SQLite file and each run `load_schema!`, and the second `create_table` raises.

Rails runs `test_help` once per `rails test` process. `parallelize` forks workers only after it
has run, and each worker gets its own database (`ActiveRecord::TestDatabases`,
`activerecord/lib/active_record/test_databases.rb`). So Rails has no concurrent schema load onto
one database.

## Acceptance criteria

- [ ] A fresh generated app (`trails new` + `generate scaffold` + `db migrate`, no test DB yet)
      passes `pnpm test` on the first run with the generator's default vitest config.
- [ ] The fix follows Rails' shape: the schema is maintained once before the workers start
      (e.g. a vitest `globalSetup` in the generated `vitest.config.ts` running `maintain_test_schema!`),
      or each worker gets its own database as `TestDatabases` does. It is not a lock or a
      `CREATE TABLE IF NOT EXISTS` Rails does not have.
- [ ] A regression test covers the concurrent first run.
