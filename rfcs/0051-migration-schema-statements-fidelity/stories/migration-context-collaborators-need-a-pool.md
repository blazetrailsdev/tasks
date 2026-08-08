---
title: "MigrationContext's optional collaborators and SchemaMigration#connection are the adapter-vs-pool gap"
status: blocked
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 140
pr: null
claim: "2026-08-07T01:08:29Z"
assignee: "check-pending-migrations-is-a-no-op-stub"
blocked-by: "Blocked on the adapter-vs-pool convergence, not on this story's own shape. Rails' MigrationContext ctor defaults its collaborators eagerly from a pool (`SchemaMigration.new(connection_pool)`, migration.rb:1214-1218). trails' SchemaMigration/InternalMetadata take an ADAPTER, across ~50 `new SchemaMigration(` call sites, so 'default from the pool' has no landing site until those hold a pool. The one adapter a pool can hand over synchronously is ConnectionPool#_getAdapterProxy (connection-pool.ts:459), and that proxy answers a Promise for every member — surfaced concretely while porting pending_migrations_test.rb: `pool.migrationContext.open()` then `migrate()` dies in Migrator#withAdvisoryLock (migration.ts:2199-2211) because the proxy's `supportsAdvisoryLocks?()` returns a truthy Promise and its `currentDatabase` resolves to undefined on SQLite. Second, acceptance bullets 2 and 4 are in tension: Rails' eager default cannot be reached without an established connection, so removing the optional args + throwing getters breaks 'connectionless file discovery still works without a pool' (28 `new MigrationContext([paths])` sites). Note the story's Context is stale on one point: `Migrator.discoverMigrations` / `Migrator.fromPath` no longer exist. Unblock once SchemaMigration/InternalMetadata hold a pool (project_pool_adapter_proxy_makes_sync_methods_async)."
closed-reason: null
---

## Context

Rails' `MigrationContext` defaults its collaborators from a connection pool
(`vendor/rails/activerecord/lib/active_record/migration.rb:1214-1218`):

```ruby
@schema_migration  = schema_migration || SchemaMigration.new(connection_pool)
@internal_metadata = internal_metadata || InternalMetadata.new(connection_pool)
```

with `connection_pool` reaching
`ActiveRecord::Tasks::DatabaseTasks.migration_connection_pool`
(`migration.rb:1365-1367`).

trails threads an _adapter_, not a pool, and has no `DatabaseTasks` pool to
reach from inside `MigrationContext`. PR #5820 worked around that two ways:

1. `MigrationContext`'s `schemaMigration` / `internalMetadata` constructor args
   are **optional**, with getters that throw
   (`"MigrationContext was built without a schema_migration"`) instead of
   defaulting. This exists so a connectionless context can be built for file
   discovery, which genuinely needs neither collaborator.
2. `SchemaMigration#connection` (`packages/activerecord/src/schema-migration.ts`)
   was added as an `@internal` getter so `MigrationContext#open` can build a
   `Migrator`. Rails has no such accessor — it holds `@pool` and never exposes
   it.

Both are documented deviations at their call sites, not accidents. They are the
adapter-vs-pool gap surfacing in one more place.

## Re-verified 2026-08-08 against `origin/main` — the size objection is resolved, the design tension is not

The old blocked-by reason said this was blocked on "~50 `new SchemaMigration(`
call sites" and could not land. **That work is now sequenced ahead of this
story** as `migration-collaborators-hold-a-pool-and-reach-connections-through-it`
(step 1) and `migration-collaborator-call-sites-pass-a-pool` (step 2), which are
this story's declared deps. When this is picked up, both collaborators already
take a pool and `ConnectionPool#migrationContext` already builds them from
`this`. `SchemaMigration#connection`'s last reader is `MigrationContext#open`,
and removing it is this story's job.

Two corrections to the old reason, both verified:

- It said "unblock once … (`project_pool_adapter_proxy_makes_sync_methods_async`)".
  That is **not a prerequisite for this story**. `_getAdapterProxy()`
  (`connection-pool.ts:459`) has exactly two callers outside its own tests —
  the two collaborator getters at `:513` and `:520` — so step 1 takes the proxy
  off the migration path entirely. The proxy's own sync/async divergence is
  real but is tracked separately as
  `0023-surfaced-deviations/pool-adapter-proxy-makes-sync-adapter-methods-async`,
  and nothing in RFC 0051 waits on it.
- It noted the Context was stale on `Migrator.discoverMigrations` /
  `Migrator.fromPath` no longer existing. Corrected — the references are gone
  from this body.

### The one live design question: acceptance bullets 2 and 4 are in tension

This is the part the old reason got right and the part this story still has to
decide. Rails' eager default cannot be reached without an established
connection, so removing the optional args + throwing getters outright would
break connectionless file discovery, which ~28 `new MigrationContext([paths])`
sites rely on.

Resolve it the way Rails' own shape does: Rails' `MigrationContext` **always**
has a pool, and the discovery-only surface it exposes (`migrations`,
`migration_files`, `parse_migration_filename`) simply never touches
`@schema_migration`. So the trails convergence is:

- the constructor defaults from a pool when one is reachable, exactly as
  `migration.rb:1214-1218` does;
- the discovery-only paths stay reachable without one, but **not** via optional
  args with throwing getters — via the collaborators simply not being consulted
  on those paths.

If, on contact, the discovery sites genuinely cannot be given a pool, the
landable answer is to keep a single narrow constructor arm for them with a
comment citing `migration.rb:1214-1218` and the specific sites — and say so in
the PR rather than expanding scope. Do not re-open the call-site migration here;
that is steps 1 and 2.

## Acceptance criteria

- [ ] `MigrationContext` reaches a connection pool the way Rails does, and
      defaults `schemaMigration` / `internalMetadata` from it
      (`migration.rb:1214-1218`).
- [ ] The throwing getters
      (`"MigrationContext was built without a schema_migration"`) are gone.
- [ ] `SchemaMigration#connection` is gone; `MigrationContext#open` builds its
      `Migrator` from the pool.
- [ ] Connectionless file discovery still works without a pool, and the
      mechanism by which it does is stated in a comment at the constructor.
- [ ] Existing migration-context / migrator / trailties `db` tests keep their
      names and pass.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, single PR from main.
