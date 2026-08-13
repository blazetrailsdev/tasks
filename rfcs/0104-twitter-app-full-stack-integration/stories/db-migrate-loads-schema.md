---
title: "trails db migrate loads db/schema.ts first, so migrating a dumped app fails"
status: draft
updated: 2026-08-13
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["activerecord", "trailties"]
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

`trails db migrate` loads `db/schema.ts` before running migrations, so on any
app whose schema has been dumped once, a fresh `db drop && db create &&
db migrate` fails with `table "users" already exists`.

Reproduced in `examples/twitter-app`:

```text
$ trails db drop && trails db create
Dropped database 'db/test.sqlite3'
Created database 'db/test.sqlite3'
$ trails db migrate
== 20260813105446 CreateUsers: migrating ===
Error: An error has occurred, this and all later migrations canceled:
table "users" already exists
```

The load happens in `migrateAll`:
`packages/activerecord/src/tasks/database-tasks.ts` — `migrateAll` →
`withTemporaryPool` → `loadSchema` (the built trace is
`dist/tasks/database-tasks.js:1399` inside `migrateAll` at `:952`). The same
call is why a freshly generated app used to die with `Schema file must export
a default function` before the generator template was fixed: `db migrate`
demands a loadable `db/schema.ts` even on an app with no schema yet.

Rails' `db:migrate` does not load the schema. Its task
(`vendor/rails/activerecord/lib/active_record/railties/databases.rake`) runs
the migrations and _then_ dumps the schema
(`ActiveRecord::Tasks::DatabaseTasks.migrate` followed by the
`db:_dump` hook). Loading the schema is `db:schema:load`,
`db:setup`, and `db:test:prepare` — never `db:migrate`.

The workaround in `examples/twitter-app` is to prepare the test database with
`trails db test:prepare` (which is the schema-load path, and is what Rails
recommends anyway) rather than `db migrate`.

## Acceptance criteria

- `trails db migrate` runs pending migrations without loading `db/schema.ts`.
- `db drop && db create && db migrate` succeeds on an app with a populated
  `db/schema.ts`.
- `db migrate` still dumps the schema afterwards, matching Rails' `db:_dump`.
- `db:schema:load` / `db:setup` / `db:test:prepare` keep loading the schema.
- A regression test covering the drop/create/migrate cycle on a dumped schema.
