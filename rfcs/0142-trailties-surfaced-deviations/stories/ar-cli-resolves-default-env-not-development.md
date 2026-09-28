---
title: "ar db:* with no TRAILS_ENV resolves default_env, not the documented development"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["activerecord-cli", "activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8197
claim: "2026-09-27T22:39:57Z"
assignee: "map-rubocop-to-eslint-in-token-renames"
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the per-package READMEs (2026-09-27, main `b4f622ae87`).
Filed under 0142 because no activerecord / activerecord-cli bucket is active.
It is the standalone-CLI sibling of
`rails-env-proc-drops-trails-env-arm-so-boot-without-trails-env-fails`.

`packages/activerecord-cli/README.md` documents that `ar` resolves
`TRAILS_ENV → NODE_ENV → "development"`, and the generated `config/database.ts`
comment says the same ("`TRAILS_ENV` selects the entry (default "development")").
In a fresh `ar new shop --driver better-sqlite3` project with neither variable
set:

```text
$ ar db:create
ar: no database configuration found for environment "default_env"
$ ar db:migrate
ar: no database configuration found for environment "default_env"
```

With `TRAILS_ENV=development` both commands work (create, migrate,
`db:migrate:status`, `db:schema:dump`).

- Every `ar db:*` command reads `DatabaseTasks.env`
  (`packages/activerecord-cli/src/db-tasks.ts:36`, `:63`, `:115`, `:155`, `:174`, …).
- `DatabaseTasks.env` is `this._env ??= DEFAULT_ENV()`
  (`packages/activerecord/src/tasks/database-tasks.ts:46-48`), and
  `DEFAULT_ENV()` falls back to `"default_env"`
  (`packages/activerecord/src/connection-handling.ts:486-490`).
- Rails: `DatabaseTasks#env` is `@env ||= Rails.env`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:103-105`),
  and `Rails.env` defaults to `"development"`. In a standalone ActiveRecord
  setup, the Rails rake tasks' host (`ar`, here) is what supplies that env.
- The e2e suites set `TRAILS_ENV` explicitly
  (`packages/activerecord-cli/src/__e2e__/sqlite-happy-path.test.ts:19-26`),
  which masks the default.

## Acceptance criteria

- With no `TRAILS_ENV` / `NODE_ENV`, `ar db:create` / `db:migrate` /
  `console` / `runner` target the `development` entry, as the README and the
  generated config comment promise. For example, `ar` seeds `DatabaseTasks.env`
  from `TRAILS_ENV → NODE_ENV → "development"` at startup, the way railties
  seeds it from `Rails.env`.
- An e2e or CLI test runs `ar db:migrate` with both variables unset.
