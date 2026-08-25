---
title: "connectsTo primary-class case displaces Base's pool; census guard is blind to same-name replacement"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps:
  - tighten-writing-pool-census-baseline-to-module-load
deps-rfc: []
est-loc: 90
priority: null
pr: 6180
claim: "2026-08-07T16:29:49Z"
assignee: "of-kind-default-type-and-normalize-arguments"
blocked-by: null
closed-reason: null
---

## Context

Same class as `ispreventingwrites-primary-class-case-displaces-base-pool` (done,
PR #5682), new site. `packages/activerecord/src/connection-handling.test.ts`'s
`connectsTo plants _connectionSpecificationName (primary class normalizes to
'Base')` calls `AppRecord.connectsTo({ database: { writing: "primary" } })` after
`primaryAbstractClass(AppRecord)`. PoolConfig normalizes that descriptor to the
name `"Base"` — which IS the behaviour under test — so the pool it establishes
DISPLACES the ambient worker pool for every later test file in the vitest worker.

The `finally` restores `Base.configurations` and resets the primary abstract class,
but not the pool: the displaced pool points at `db/primary.sqlite3`, which is not
the worker's database.

The writing-pool census guard added by PR #6126 (`packages/activerecord/src/cases/helper.ts`)
cannot see this: it counts pools per connection name, and a displacement keeps the
count at one. It is invisible for exactly the reason the story it came from was
filed — `setup_transactional_fixtures` pins and `verify!`s every writing pool
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:175-180` →
`connection_adapters/abstract/connection_pool.rb:335`), so the next file to pin
opens `db/primary.sqlite3` for real. The case only stays green today because
SQLite creates the file on demand; on PG/MySQL it is the `NoDatabaseError` /
`ER_DBACCESS_DENIED_ERROR` shape #6109 surfaced.

The story's teardown fix could not remove it: `AppRecord.removeConnection()` would
take the suite's primary pool with it, because that is the same pool.

## Converged shape

Restore the ambient worker pool in the `finally`, the way the sibling describe fixed
by #5682 does (`restoreWorkerConnection()` in that file). Then tighten the census
guard so a DISPLACED pool is caught, not just an added one: compare the baseline
pool IDENTITY per connection name, not only the count, so a same-named replacement
reds the file that did it.

## Acceptance criteria

- [ ] The case restores the worker's `Base` pool in its `finally`.
- [ ] `cases/helper.ts`'s guard fails a file that replaces a baseline pool with a
      different pool of the same connection name, naming it.
- [ ] The guard is proven: reverting the `finally` above makes it red and names `Base`.
- [ ] Green on SQLite, PG and MySQL.
