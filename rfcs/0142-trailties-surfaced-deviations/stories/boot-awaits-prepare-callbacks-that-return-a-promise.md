---
title: "trailties: boot does not await toPrepare callbacks, so an async establishConnection there is fire-and-forget"
status: draft
updated: 2026-11-04
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails runs `to_prepare` blocks synchronously, and `establish_connection` is
synchronous too, so a connection made in one is in place when the block
returns (railties/lib/rails/application/finisher.rb `run_prepare_callbacks`;
activerecord/lib/active_record/connection_handling.rb:68 for `connects_to`).

In trails each half is ported faithfully, but together they don't work:

- packages/trailties/src/trailtie/configuration.ts:7 types
  `ConfigurationBlock` as returning `void`.
- packages/trailties/src/application/finisher.ts:141-142,
  `run_prepare_callbacks`, calls `this.reloader.prepareBang()` and returns.
- packages/activesupport/src/reloader.ts:116, `static prepareBang(): void`, runs
  the callbacks without awaiting them.
- packages/activerecord/src/connection-adapters/abstract/connection-handler.ts:87-102,
  `async establishConnection`, awaits `resolvePoolConfig` **before** it
  registers the pool.

So `config.toPrepare(() => Model.establishConnection(cfg))`, which is the Rails
way to connect an autoloaded abstract class from config, drops its promise.
The pool appears a few microtasks later, and a bad config ends up as an
unhandled rejection instead of a boot failure.

## Found by

trailmap#113: `config/initializers/stats-sync-database.ts` connects
`StatsSync::StatsSyncRecord` with `void record.establishConnection(...)`. The
gap is recorded in trailmap's rails/DEVIATIONS.md under "trails: prepare
callbacks are not awaited".

## Acceptance criteria

- Boot (`run_prepare_callbacks`, and `Reloader.prepareBang` on reload) awaits a
  prepare callback that returns a promise, and a rejection fails boot.
- A trailties test: a `toPrepare` block that awaits `establishConnection` has
  its pool registered when `Trails.initialize()` resolves, and a rejecting
  block makes `initialize()` reject.
- Once that is vendored, trailmap awaits the connection in its block and
  deletes the DEVIATIONS entry.
