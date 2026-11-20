---
title: "Schema-cache warm reaches the unmerged database.ts config when DATABASE_URL is set"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TRAILS_ENV=production DATABASE_URL=postgres://…neon… node bin/trails db:migrate` in `examples/cloudflare-worker` (trails#10380) migrates the Neon database correctly. It also prints:

    Failed to load the schema cache because of NoDatabaseError: We could not find your database: trails.

`trails` is the localhost database in the example's `config/database.ts`, which is the same hash in every environment. So some pool still points at the file's config instead of the config with `DATABASE_URL` merged in. The warning comes from `warmSchemaCache` in `packages/trailties/lib/trailties/active-record.ts:330-345`, run from a `toPrepare` over `connectionPoolList("all")`.

Rails does no such warm on every pool. Its eager schema step, `vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:156-183`, runs only when `!check_schema_cache_dump_version && eager_load && !Rails.env.local?`. It touches only models whose `schema_reflection.cached?` is true, and production's database comes from `merge_db_environment_variables` (`activerecord/lib/active_record/database_configurations.rb:286-295`).

## Acceptance criteria

- Find which pool `warmSchemaCache` reaches with the unmerged config during a `db:*` task: a per-env pool that `DatabaseTasks` opened, or the boot pool.
- With `DATABASE_URL` set, `trails db:migrate` prints no schema-cache warning for a database the run never uses.
- Converge the warm toward `railtie.rb:156-183`'s guards where the async-peek rule in packages/activerecord/CLAUDE.md "Schema reflection peeks at a warm cache" allows it.
