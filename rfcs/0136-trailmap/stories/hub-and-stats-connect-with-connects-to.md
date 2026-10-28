---
title: "Hub and Stats use connectsTo, and the connecting initializers go"
status: ready
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`app/models/hub.ts` and `app/models/stats.ts` connect by hand. `config/initializers/hub-database.ts` and `stats-database.ts` call `establishConnection` when they're loaded, and the hub initializer throws without `HUB_DATABASE_URL`. `hub.ts` explains this: `connectsTo` couldn't resolve configurations because the trailtie registered them only for `trails db`.

That premise is gone on trails `main`. `active_record.initialize_database` (`packages/trailties/src/trailties/active-record.ts:248`) now sets `Base.configurations` at boot, as Rails' `activerecord/lib/active_record/railtie.rb:256-262` does.

Rails declares a second database on an abstract class with `connects_to database: { writing: :hub }` (`activerecord/lib/active_record/connection_handling.rb:81`), with the entries in `config/database.yml`. `rails/` in this repo does exactly that.

## Acceptance criteria

- [ ] `config/database.ts` declares `hub` and `stats` per environment, and `Hub`/`Stats` use `connectsTo`.
- [ ] The two connecting initializers are deleted. A missing database fails at first use, not at import, so `trails-tsc-views build` can load `config/initializers` with no databases.
- [ ] Depends on the re-vendor in `trailmap-runs-under-plain-node`.
