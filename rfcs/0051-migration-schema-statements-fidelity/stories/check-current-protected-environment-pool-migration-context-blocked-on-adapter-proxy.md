---
title: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps:
  - migration-collaborators-hold-a-pool-and-reach-connections-through-it
  - migration-context-collaborators-need-a-pool
deps-rfc: []
est-loc: null
pr: 6274
claim: "2026-08-09T02:15:49Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

`check_current_protected_environment!`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:635-649`)
reads the migration context straight off the pool and rescues
`NoDatabaseError` _inside_ the block:

```ruby
with_temporary_pool(db_config) do |pool|
  migration_context = pool.migration_context
  ...
rescue ActiveRecord::NoDatabaseError
end
```

`check-current-protected-environment-uses-pool-migration-context` converged the
half it could: `InternalMetadata#enabled?` now derives from the pool's
db_config (`internal_metadata.rb:35-36`) instead of an explicit `{ enabled }`
constructor option, and `ConnectionPool`'s adapter proxy answers `pool` with
the pool itself so `pool.internalMetadata.enabled` honours
`useMetadataTable: false`.

`checkCurrentProtectedEnvironmentBang`
(`packages/activerecord/src/tasks/database-tasks.ts`) therefore still goes
through `withTemporaryConnection` + `DatabaseTasks._migrationContextFor`, and
`_migrationContextFor` still carries `@internal` rather than `private`. Both
deviations are documented at the call site.

## Re-verified 2026-08-08 against `origin/main` — the proxy blocker is now owned upstream

The old blocked-by reason correctly identified the mechanism and correctly
declined to fix it here. Both halves it named are now sequenced ahead of this
story rather than left implicit:

**Blocker 1 — the pool's adapter proxy async-ifies the synchronous adapter
surface.** `ConnectionPool#migrationContext` builds `SchemaMigration` /
`InternalMetadata` over `_getAdapterProxy()` (`connection-pool.ts:459`), whose
`get` trap routes **every** member through `pool.withConnection(...)`.
`InternalMetadata#tableExists` (`internal-metadata.ts`) calls the _synchronous_
`this._connection.toSql(sm)`, which through the proxy returns a Promise; the
query then receives a Promise instead of SQL, better-sqlite3 raises
`TypeError: Expected first argument to be a string`, and `tableExists()`
swallows it and answers `false`. Switching the check to `pool.migrationContext`
today reds 11 tests across
`tasks/database-tasks-protected-environments-env.trails.test.ts`,
`tasks/database-tasks.test.ts` and `trailties/src/commands/db.test.ts` with
`NoEnvironmentInSchemaError`.

This is **fixed by `migration-collaborators-hold-a-pool-and-reach-connections-through-it`**
(step 1 of the collaborator convergence), which moves both collaborators onto
the pool and takes the proxy off the migration path entirely — verified on
`origin/main` that `_getAdapterProxy()` has exactly two callers outside its own
tests, `connection-pool.ts:513` and `:520`, i.e. only those two getters.

Note the old reason framed the remaining work as "101 `new SchemaMigration(…)` /
`new InternalMetadata(…)` construction sites … far past this bundle's 500 LOC
ceiling". Two corrections: the ceiling is now **700**, and the count conflated
198 raw sites (103 + 95) with the work, 159 of which are one-token mechanical
edits and only 29 of which are production code. That migration is now
`migration-collaborator-call-sites-pass-a-pool`, and it is a single PR.

**Blocker 2 — eager leasing.** `DatabaseTasks.withTemporaryConnection` leases
eagerly, so `NoDatabaseError` can surface from the lease rather than from inside
the block — which is why the rescue currently wraps the whole call instead of
sitting inside it (`database_tasks.rb:648-649`). This half is **this story's own
work** and is not blocked by anything: moving to `withTemporaryPool` +
`pool.migrationContext` is precisely what makes the lease lazy, because the pool
is handed over without a connection being checked out.

With the collaborators on a pool, criterion 1 below is satisfied by the deps and
this story becomes the call-shape change it was always meant to be.

## Acceptance criteria

- [ ] `pool.internalMetadata.tableExists()` and `pool.schemaMigration` queries
      work off a pool-built migration context (satisfied by the deps — verify,
      don't re-implement).
- [ ] `checkCurrentProtectedEnvironmentBang` uses `withTemporaryPool` +
      `pool.migrationContext`, mirroring `database_tasks.rb:635-637`.
- [ ] The `NoDatabaseError` rescue moves inside the block
      (`database_tasks.rb:648-649`).
- [ ] `DatabaseTasks._migrationContextFor` goes back to `private`, or is
      removed if no caller remains.
- [ ] The protected-environment suites above stay green, including the
      `useMetadataTable` coverage, with no test renames.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, single PR from main.
