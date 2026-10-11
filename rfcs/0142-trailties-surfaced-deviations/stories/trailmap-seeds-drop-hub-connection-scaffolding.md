---
title: "trailmap db/seeds.ts drops its Hub.establishConnection scaffolding once it vendors trails#8768"
status: draft
updated: 2026-10-11
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8768 made `trails db seed` boot the application before loading
`db/seeds.ts` (`bootApplicationBang()` is the first line of `runSeed`,
`packages/trailties/src/commands/db.ts`) and close every pool afterwards
(`releaseTaskConnections`, the `db` command's `postAction` hook). Rails'
`db:seed` depends on `:load_config` → `:environment`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/databases.rake`,
`task load_config: :environment`), so a seed file never establishes
connections itself.

trailmap's `db/seeds.ts` still carries the workaround from before that fix:
`await Hub.establishConnection(hubDatabaseConfig())`, `await loadHubSchemas()`
ahead of the seeds and `await Hub.removeConnection()` after them. Deleting it
was the last acceptance criterion of
`db-seed-runs-without-the-application-environment`; it was verified in a
scratch checkout on trails#8768 (`pnpm db:reset` against a Postgres hub,
`EXIT=0`, one `Running seeds...`) but could not ship there, because it is only
correct once trailmap vendors a trails that includes #8768.

## Acceptance criteria

- [ ] trailmap vendors a trails at or after trails#8768.
- [ ] `db/seeds.ts` in trailmap has no `Hub.establishConnection`,
      `loadHubSchemas` or `Hub.removeConnection`; the hub connection comes from
      `config/initializers/hub-database.ts`.
- [ ] `pnpm db:reset` against a Postgres hub seeds once and exits zero.
