---
title: "trailties-active-record-load-hook-runs-at-first-base-reference"
status: draft
updated: 2026-11-25
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

`vendor/rails/v8.0.5.2/railties/test/application/rake/multi_dbs_test.rb:1021-1041` ("db:prepare runs seeds once")
boots, then calls `use_postgresql(multi_db: true)`, and `Dog.count` reaches Postgres. The mechanism is not
`reload`: `active_record.initialize_database` (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/railtie.rb:256-261`)
registers `ActiveSupport.on_load(:active_record) { self.configurations = Rails.application.config.database_configuration }`,
and in Rails `ActiveRecord::Base` is autoloaded on first reference, which happens after `use_postgresql` rewrote
`config/database.yml`. So the configuration is read when Base first loads.

In trails `packages/activerecord/lib/base.ts:2524` runs `runLoadHooks("active_record", Base)` at module evaluation, and
`packages/trailties/lib/trailties/active-record.ts:340-353` therefore reads `databaseConfiguration()` during boot.
The same eager-Base fact blocks `configuration_test.rb:3450` "ActiveJob::Base.retry_jitter can be set by config".

## Acceptance criteria

- [ ] The `active_record` load hooks run when the app first references `ActiveRecord::Base` after boot (as Rails' autoload does), not at import, or the operator rules the eager load permanent.
- [ ] "db:prepare runs seeds once" in `packages/trailties/test/application/rake/multi-dbs.test.ts` calls `t.bootTrails()` before `t.usePostgresql({ multiDb: true })` and passes on the PostgreSQL lane.
