---
title: "connectsTo is synchronous, as Rails' is, so a class body can call it"
status: draft
updated: 2026-10-27
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares a second database in an abstract class's body: `connects_to database: { writing: :hub }`. That works because `connects_to` (`activerecord/lib/active_record/connection_handling.rb:81-110`) is synchronous. It calls `ConnectionHandler#establish_connection` (`connection_adapters/abstract/connection_handler.rb:115`), which resolves the pool config and registers a pool in the pool manager without connecting. The first checkout connects.

In trails both are `async`:

- `connectsTo` is `export async function` (`packages/activerecord/src/connection-handling.ts:25`) and awaits each `establishConnection`.
- `ConnectionHandler#establishConnection` (`connection-adapters/abstract/connection-handler.ts:87`) awaits `resolvePoolConfig` (`:102`), which loads the adapter module.

So a class body can't call it. A `static { this.connectsTo(...) }` leaves a promise nobody awaits: the first query races the pool registration and can raise `ConnectionNotDefined`, and a rejection (an unknown database key, say) goes uncaught. trails' own tests always `await` it (`connection-handling.trails.test.ts:679-682`), and no example or generator calls it from a class body.

Found by trailmap (story `hub-and-stats-connect-with-connects-to`). Its `Hub` and `Stats` classes still connect from awaited initializers because of this. Related: `solid-queue-record-class-body-reads-config-after-initializers` moved `SolidQueue::Record`'s `connects_to` into an `onLoad` hook for an ordering reason, and that receipt is affected too.

## Converged shape

- `connectsTo` and `ConnectionHandler#establishConnection` are synchronous. They resolve the config and register the pool. Anything that must load (the adapter module) loads at first checkout, which is already awaited.
- `class Hub extends ApplicationRecord { static { this.abstractClass = true; this.connectsTo({ database: { writing: "hub" } }); } }` works with no initializer, as Rails' does.

## Acceptance criteria

- [ ] `connectsTo` returns synchronously, and a query issued right after it, in the same tick, uses the registered pool.
- [ ] An unknown database key raises from `connectsTo` itself, synchronously, as Rails' `resolve_config_for_connection` does.
- [ ] A test declares `connectsTo` in an abstract class's static block and queries through a subclass without awaiting anything else.
