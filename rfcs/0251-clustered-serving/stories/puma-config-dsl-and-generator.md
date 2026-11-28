---
title: "config/puma.ts: the puma.rb DSL on the cluster, and the generator template"
status: ready
updated: 2026-11-28
rfc: "0251-clustered-serving"
cluster: config
packages: [rackup, trailties]
deps: [cluster-primary-and-workers]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/puma.rb.tt`
(`threads` `:27-28`, `port` `:31`, `plugin` `:34,38`, `pidfile` `:43`). RFC § Decisions:
the file is `config/puma.ts`, `TRAILS_MAX_THREADS` sizes the pool, and
`WEB_CONCURRENCY` sets `workers`.

## Acceptance criteria

- [ ] A DSL with `threads`, `workers`, `port`, `bind`, `pidfile`, `environment`, `plugin`, receipted once on its class.
- [ ] The generated `database.yml` templates gain `pool: <%= ENV.fetch("TRAILS_MAX_THREADS") { 5 } %>`, as `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/databases/sqlite3.yml.tt:9` has.
- [ ] `workers` reads `WEB_CONCURRENCY`.
- [ ] The app generator writes `config/puma.ts` mirroring `puma.rb.tt` line for line, `skip_solid?` arm included.
