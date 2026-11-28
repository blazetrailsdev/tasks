---
title: "Campfire example: app skeleton, config, schema, migrations and fixtures"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, solid-cable, solid-cache, solid-queue]
deps: [vendor-campfire-source]
deps-rfc: []
est-loc: 1900
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app) and § Infrastructure Campfire swaps out. Campfire's
`config/` (391 lines), `config/environments/` (288), `config/initializers/`
(267), 18 migrations (312), fixtures (346 lines of YAML) and
`test/test_helpers/` (292). Migrations are `Migration[7.2]`; Bookshelf's
precedent is `Migration.get(8.0)`. `cable.yml` and the cache store name Redis,
and production sets `queue_adapter = :resque`.

## Acceptance criteria

- [ ] `examples/campfire` scaffolded as `examples/electron-writebook` is, without Electron
- [ ] config, environments, initializers (except `web_push.rb`, `vapid.rb`, `sqlite_wal_checkpoint.rb`, owned by `campfire-jobs-web-push-and-wal-checkpoint`), migrations, `db/schema` and fixtures ported file for file
- [ ] Solid Cable, Solid Cache and Solid Queue in place of Redis and Resque, each changed line receipted
- [ ] `sentry.rb` omitted with a receipt; `resque.rb` and `lib/tasks/resque.rake` omitted
- [ ] `bin/trails db:prepare` builds the schema and loads the fixtures

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
