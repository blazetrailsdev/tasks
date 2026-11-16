---
title: "trailmap-stats-sync-down-raises-irreversible-migration"
status: claimed
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-16T00:51:34Z"
assignee: "local-cache-middleware-requires-rack-at-call-time"
blocked-by: null
closed-reason: null
---

# trailmap's CreateStatsSyncTables#down raises ActiveRecord::IrreversibleMigration

## Context

trails#10156 exports `IrreversibleMigration` from `@blazetrails/activerecord`
(`packages/activerecord/lib/index.ts`; Rails' `ActiveRecord::IrreversibleMigration`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb`). trailmap's
`db/stats-sync-migrate/20261031000001_create_stats_sync_tables.ts:283-285` still
throws `new Error("CreateStatsSyncTables is irreversible")`. trailmap consumes
activerecord through `vendor/blazetrails-activerecord-0.1.0.tgz`, so the change
needs that tarball re-vendored after trails#10156 merges.

## Acceptance criteria

- trailmap re-vendors the activerecord tarball with the export.
- `CreateStatsSyncTables#down` is `throw new IrreversibleMigration()`, as a Rails
  migration's `raise ActiveRecord::IrreversibleMigration`.
