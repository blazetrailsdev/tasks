---
title: "twitter-clone smoke fails: its migrations extend Migration directly"
status: in-progress
updated: 2026-10-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 20
priority: 1
pr: trails#9284
claim: "2026-10-24T19:49:34Z"
assignee: "twitter-clone-smoke-migrations-extend-migration-directly"
blocked-by: null
closed-reason: null
---

## Context

`examples/twitter-clone`'s `pnpm smoke` (`TRAILS_ENV=test tsx src/smoke.ts`) fails on `main` `4837c7ba7a`, found while refreshing the READMEs in trails#8195:

```text
StandardError: Directly inheriting from ActiveRecord::Migration is not supported. Please specify the Active Record release the migration was written for:

  class CreateUsers < ActiveRecord::Migration[8.0]
```

Since #8794 a direct `extends Migration` raises, as Rails' `Migration.inherited` does (`activerecord/lib/active_record/migration.rb`, `def self.inherited`). The example's migrations still use the old shape: `examples/twitter-clone/db/migrate/20260101000001_create_users.ts:3` and `20260101000003_create_follows.ts:3` declare `class … extends Migration`. Generated apps already write `extends Migration.get(8.0)`.

`packages/activerecord/README.md` ("Examples") says `pnpm smoke` ends with `Smoke test passed ✅`.

## Acceptance criteria

- Every migration under `examples/twitter-clone/db/migrate/` extends `Migration.get(8.0)`.
- `pnpm smoke` in `examples/twitter-clone` ends with `Smoke test passed ✅`.
- The smoke run is wired into CI (or an existing CI job already runs it), so the next breaking change reds there.
