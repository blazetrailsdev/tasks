---
rfc: "0196-solid-stack"
title: "Solid Cache, Solid Queue and Solid Cable as the trails production backends"
status: active
created: 2026-10-17
updated: 2026-10-29
owner: "@deanmarano"
packages:
  - "solid-cache"
  - "solid-queue"
  - "solid-cable"
  - "activesupport"
  - "trailties"
  - "activerecord"
clusters:
  - solid-stack
priority: 3
---

# RFC 0196 — Solid Cache, Solid Queue and Solid Cable as the trails production backends

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
  RFC 0169's async adapter interface. Each package gets its own skeleton
  story, and each gem's `install` generator is its own story.
- **Memcached and Redis** stay unported. Their Rails files are in the parity
  unported-files register (`scripts/parity/unported-files/{activesupport,actionpack,actioncable}.ts`
  in trails, landed by trails#9009) with a `SOLID_STACK_ONLY` reason: activesupport's
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
- **Leave the Solid gems unvendored and out of scope** (RFC 0169 / 0177's
  stance). Then `trails new` has no production cache, queue or cable backend
  without an external service, and the gems' tests never enter parity.
- **One `@blazetrails/solid` package.** Rails ships three gems with separate
  versions, gemspecs and test suites; one package would break the
  one-package-per-source compare mapping and force apps that want only cache
  to install the queue's process layer.

## Rollout

1. Phase 1: `vendor-solid-cache-queue-cable-gems`
2. Phase 2 (cache): `solid-cache-package-skeleton`,
   `port-solid-cache-entry-model-and-store`,
   `lookup-store-resolves-solid-cache-store`
3. Phase 3 (cable): `solid-cable-package-skeleton`, `port-solid-cable-adapter`
4. Phase 4 (queue): `solid-queue-package-skeleton`,
   `port-solid-queue-adapter-and-models`, `port-solid-queue-worker`,
   `port-solid-queue-dispatcher`,
   `port-solid-queue-scheduler-and-recurring-tasks`,
   `port-solid-queue-supervisor`
5. Phase 5 (generators): `solid-cache-install-generator`,
   `solid-queue-install-generator`, `solid-cable-install-generator`,
   `app-generator-installs-solid-stack`

## Verification

- `parity:api` and `parity:test` report all three gems. At RFC close each
  gem is at 100% `parity:api` for its `lib/` and `app/` files and at least
  90% `parity:test` (ported, not skipped), with any gap listed in the
  unported register with a reason.
- `ActiveSupport::Cache.lookup_store(:solid_cache_store)` returns a working
  store on SQLite, PostgreSQL and MariaDB.
- An app generated with `trails new` runs cache, jobs and cable on the Solid
  backends with no memcached or Redis service.

## Decisions

- **Solid Queue's supervisor runs its processes as threads, not forks.**
  `Supervisor#start_process` (`vendor/solid_queue/v1.1.3/lib/solid_queue/supervisor.rb:76-88`)
  forks a copy of the booted parent and calls `start` in the child. Node has
  no `fork`: `child_process.fork` starts a fresh interpreter that shares
  nothing with the parent (CLAUDE.md, "Runtime facts Node does not expose"),
  and ruby-compat has no `fork`, `Process.kill` or `waitpid2`. Spawning one
  `bin/jobs` child per configured process was rejected, because each child
  would re-boot the app and re-read the configuration to find its slot, which
  no Solid Queue code does. So `start_process` sets `mode = :async`, which
  `Processes::Runnable` already supports (`processes/runnable.rb:5-17`), and
  the supervisee runs in a ruby-compat `Thread`. Upstream made the same move
  in solid_queue 1.2, which added an async supervisor mode. The Supervisor's
  other methods keep their names and order: `forks` is keyed by process name
  where Rails keys it by pid; `waitpid2` reaps a supervisee whose thread has
  ended; `signal_process` runs what the child's own trap would
  (`processes/supervised.rb:27-37`), which is `stop` for `TERM`/`INT` and a
  thread kill for `QUIT`. Ruled by the repo owner on 2026-10-26
  (`port-solid-queue-supervisor`).
