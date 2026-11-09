---
title: "establish-connection-reads-database-url-set-after-boot"
status: claimed
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-09T18:50:32Z"
assignee: "establish-connection-reads-database-url-set-after-boot"
blocked-by: null
closed-reason: null
---

## Context

Rails `railties/test/application/initializers/frameworks_test.rb:361-374` sets `ENV["DATABASE_URL"]` after boot and expects `ActiveRecord::Base.establish_connection` (no args) to connect to it. In trails the same test (skipped in `packages/trailties/test/application/initializers/frameworks.test.ts`) gets `storage/development.sqlite3`: `establishConnection` resolves from configurations built at boot and never re-reads `DATABASE_URL`. Compare Rails `activerecord/lib/active_record/database_configurations.rb` (`resolve` / env URL merge) and `connection_handling.rb#establish_connection`.

## Acceptance criteria

- `establishConnection()` honors a `DATABASE_URL` set after boot, as Rails does.
- Un-skip "active record establish_connection uses DATABASE_URL even if Trails.env is set"; it passes.
