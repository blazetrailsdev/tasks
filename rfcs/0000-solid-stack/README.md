---
rfc: "0000-solid-stack"
title: "Solid Cache, Solid Queue and Solid Cable as the trails production backends"
status: draft
created: 2026-10-17
updated: 2026-10-17
owner: "@deanmarano"
packages: ["solid-cache", "solid-queue", "solid-cable", "activesupport", "trailties"]
clusters:
  - solid-stack
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Solid Cache, Solid Queue and Solid Cable as the trails production backends

## Summary

Rails 8's default production backends for caching, jobs and Action Cable are
the database-backed Solid gems (`solid_cache` 1.0.7, `solid_queue` 1.1.3,
`solid_cable` 3.0.7, pinned in `vendor/rails/v8.0.2/Gemfile.lock:577-586`).
trails ports those three over ActiveRecord and does not port the memcached or
Redis backends.

## Motivation

The cache work was chained to memcached and Redis:
`cache-store-async-over-npm-clients` depended on
`redis-cache-store-async-over-npm-client` and
`mem-cache-store-async-over-npm-client`, and the second was blocked by the
owner's 2026-10-15 ruling to avoid memcached. The async `Store` base those
backends need is already done (`cache-store-async-store-and-local-stores`,
`cache-store-async-consumers`). The memcached and Redis edges were removed on
2026-10-17, so Solid Cache needs nothing that is not already shipped.

RFC 0169 (activejob) and RFC 0177 (actioncable) both list their Solid gem as
"a separate, unvendored gem; future work". This RFC is that future work.

## Design

- **Vendoring.** All three gems are added to `vendor/sources.ts` at the
  `Gemfile.lock` versions and compared by `parity:api` / `parity:test` like
  any other source.
- **Packages.** One package per gem, named after it: `@blazetrails/solid-cache`,
  `@blazetrails/solid-queue`, `@blazetrails/solid-cable`. Each one depends on
  `@blazetrails/activerecord` and is tested on the three canonical adapters.
- **Solid Cache** ports `SolidCache::Store` (an `ActiveSupport::Cache::Store`
  subclass) and the `SolidCache::Entry` model. `lookup_store(:solid_cache_store)`
  resolves it the way Rails does, through the gem's
  `lib/active_support/cache/solid_cache_store.rb`.
- **Solid Cable** ports `ActionCable::SubscriptionAdapter::SolidCable` on top
  of RFC 0177's base adapter and subscriber map.
- **Solid Queue** ports the `:solid_queue` queue adapter, its job and execution
  models, and the worker, dispatcher and supervisor processes, on top of
  RFC 0169's async adapter interface.
- **Memcached and Redis** stay unported. Their Rails files are in the parity
  unported-files register with a `SOLID_STACK_ONLY` reason: activesupport's
  `cache/mem_cache_store.rb` and `cache/redis_cache_store.rb`, actionpack's
  `dispatch/session/mem_cache_store_test.rb`, and actioncable's
  `subscription_adapter/redis.rb`. ActiveJob's gem queue adapters were already
  listed there.

## Non-goals

- **memcached / Dalli backends.** Deferred by owner ruling (2026-10-15).
- **Redis backends** (cache store, cable adapter). Deferred by owner ruling
  (2026-10-17).
- **Mission Control and other Solid companion gems.** Not Rails defaults.

## Alternatives considered

- **Port Redis first, as Rails' pre-8 default.** That needs an npm client as a
  peer dependency and a Redis CI service. The Solid gems need neither.

## Rollout

1. Phase 1: `vendor-solid-cache-queue-cable-gems`
2. Phase 2 (cache): `solid-cache-package-skeleton`,
   `port-solid-cache-entry-model-and-store`,
   `lookup-store-resolves-solid-cache-store`
3. Phase 3 (cable): `port-solid-cable-adapter`
4. Phase 4 (queue): `port-solid-queue-adapter-and-models`
5. Phase 5: `app-generator-installs-solid-stack`

## Verification

- `parity:api` and `parity:test` report all three gems, with deltas that are
  never negative.
- `ActiveSupport::Cache.lookup_store(:solid_cache_store)` returns a working
  store on SQLite, PostgreSQL and MariaDB.
- An app generated with `trails new` runs cache, jobs and cable on the Solid
  backends with no memcached or Redis service.

## Open questions

- Should Solid Queue's supervisor fork worker processes or run them as worker
  threads? Node's `child_process.fork` does not copy the parent's heap
  (CLAUDE.md, "Runtime facts Node does not expose").
