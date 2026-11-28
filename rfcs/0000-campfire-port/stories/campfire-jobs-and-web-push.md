---
title: "Campfire example: jobs on Solid Queue and the web push pool"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: []
deps: [campfire-models-and-migrations, web-push-port, surfguard-port]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design and Open question 2. Six jobs; `config.active_job.queue_adapter = :resque`
in production. `lib/web_push/pool.rb` and `connections.rb` deliver on a
thread pool over pinned TLS connections; `config/initializers/web_push.rb`
prepends `PersistentRequest` onto `WebPush::Request` and shuts the pool down
`at_exit`. `lib/rails_ext/sqlite_wal_checkpoint.rb` forks.

## Acceptance criteria

- [ ] jobs on Solid Queue, cache on Solid Cache, each config change receipted
- [ ] `WebPush::Pool` on ruby-compat `Thread`, `Connections`, `PersistentRequest` ported
- [ ] WAL checkpoint ported per the RFC's answer to Open question 2
- [ ] job and push tests ported and passing
