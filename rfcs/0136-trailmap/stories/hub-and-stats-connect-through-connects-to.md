---
title: "Hub and Stats connect through connectsTo, as the Rails twin does"
status: ready
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: ["connects-to-is-synchronous-and-callable-from-a-class-body"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`app/models/hub.ts:19-25` and `app/models/stats.ts:13` establish their connections by hand, from `config/initializers/*-database.ts`, instead of `connectsTo` as the Rails twin does. Ruby:

- `rails/app/models/hub.rb:10` `connects_to database: { writing: :hub }`
- `rails/app/models/stats.rb:7` `connects_to database: { writing: :stats, reading: :stats }`

The comment in hub.ts gives the reason: `connectsTo` raised `AdapterNotSpecified` because only the `trails db` commands registered `Base.configurations`. On trails main that is no longer true. `packages/trailties/src/trailties/active-record.ts:248-256` (`active_record.initialize_database`) sets `Base.configurations(await databaseConfiguration())` at boot, as Rails' `activerecord/lib/active_record/railtie.rb:256-262` does.

The remaining blocker is framework-side and already filed: `connectsTo` is async in trails, so a class body cannot call it (`connects-to-is-synchronous-and-callable-from-a-class-body`, 0189).

## Acceptance criteria

- After re-vendoring a trails that has both fixes, Hub and Stats declare `connectsTo` in their class bodies, as the twin does.
- The hand-written establishConnection initializers for hub and stats are deleted.
- The hub.ts / stats.ts comments describing the workaround are removed.
- The pages that read hub and stats data still render. Include screenshots per CLAUDE.md.
