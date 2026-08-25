---
title: "SchemaMigration/InternalMetadata hold a pool and reach connections through it (step 1 of 2)"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 130
pr: 6239
claim: "2026-08-08T15:16:01Z"
assignee: "generate-migrator-advisory-lock-id-probes-and-falls-back"
blocked-by: null
closed-reason: null
---

## Context

This is **step 1 of 2** in the adapter-vs-pool convergence for
`SchemaMigration` / `InternalMetadata`. It changes what the two classes hold
internally and how they reach a connection, **without touching a single
construction site**. Step 2
(`migration-collaborator-call-sites-pass-a-pool`) flips the call sites and
deletes the compatibility seam this story introduces.

Rails builds both collaborators from a **connection pool** and reaches a
connection through `@pool.with_connection`:

```ruby
# internal_metadata.rb:20-22
def initialize(pool)
  @pool = pool
  @arel_table = Arel::Table.new(table_name)
end

# internal_metadata.rb:41-45
def []=(key, value)
  @pool.with_connection do |connection|
    ...
  end
end
```

`SchemaMigration` is the same shape (`schema_migration.rb:12-17`).

trails threads an **adapter** into both
(`packages/activerecord/src/schema-migration.ts`,
`packages/activerecord/src/internal-metadata.ts`). That single divergence is
what forces three separate workarounds elsewhere in this RFC, and it is why
`migration-context-collaborators-need-a-pool`,
`internal-metadata-takes-a-pool-nullpool-arm-reads-enabled` and
`check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy`
have all been stuck:

1. **`ConnectionPool#schemaMigration` / `#internalMetadata` must manufacture an
   adapter to hand over.** They do it with `_getAdapterProxy()`
   (`connection-adapters/abstract/connection-pool.ts:459`), a `Proxy` whose
   `get` trap routes every member through `pool.withConnection(...)` and so
   **answers a Promise for every member** — including Rails' synchronous
   `to_sql`. `SchemaMigration` already carries an `await`-the-maybe-Promise
   hack for exactly this (`schema-migration.ts`, `_toSql`), and
   `InternalMetadata#tableExists` still feeds the Promise to `execute`, where
   better-sqlite3 raises `TypeError: Expected first argument to be a string`
   and `tableExists()` swallows it into a silent `false`.
2. `SchemaMigration#connection` exists as an `@internal` getter that Rails has
   no analogue for — Rails holds `@pool` and never exposes it.
3. `InternalMetadata#enabled` has to read `adapter.pool.dbConfig` and soften the
   result (`!== false`), because a bare adapter's `NullPool` answers
   `NULL_CONFIG`.

Verified on `origin/main`: `_getAdapterProxy()` has exactly **two** callers
outside its own tests — `connection-pool.ts:513` and `:520`, the two
collaborator getters. Nothing else in the codebase depends on it. So moving the
collaborators onto a pool takes the proxy off the migration path entirely.

## Converged shape

Both classes hold a pool typed `ConnectionPool | NullPool` — the same union
`AbstractAdapter#pool` already carries (`abstract-adapter.ts:866`) — and every
query body reaches its connection through `pool.withConnection(...)`
(`connection-pool.ts:901`), mirroring `internal_metadata.rb:41-45`. Every method
on both classes is already `async`, so this is a body rewrite with no signature
churn, and `SchemaMigration#_toSql`'s "await the maybe-Promise" hack disappears
because `toSql` is once again called on a real connection.

`ConnectionPool#schemaMigration` / `#internalMetadata` pass `this`.

### The compatibility seam (temporary, deleted by step 2)

The ~198 existing construction sites still pass an adapter, and they must keep
working for this PR to land green. So for this story only, the constructor
accepts **either**:

```ts
constructor(poolOrAdapter: ConnectionPool | NullPool | DatabaseAdapter)
```

normalising to `{ pool, fallbackAdapter }`: given an adapter it stores
`adapter.pool` **and** keeps the adapter itself as the fallback; given a pool it
stores the pool with no fallback. The connection accessor is then

```ts
// SEAM (delete in migration-collaborator-call-sites-pass-a-pool)
private async _withConnection<T>(fn: (c: DatabaseAdapter) => T | Promise<T>) {
  if (this._fallbackAdapter) return await fn(this._fallbackAdapter);
  return await this._pool.withConnection(fn);
}
```

The fallback arm is what keeps NullPool-backed adapters — which cannot
`checkout()` (`connection-pool.ts`, `NullPool#checkout` throws
`ConnectionNotEstablished`) — working until step 2 gives every site a real pool.
Mark it with that exact `SEAM` comment naming the successor story, so step 2 has
an unambiguous grep target.

**Do not** converge `InternalMetadata#enabled` here. It keeps its softened
`!== false` arm and its deviation note; making it faithful is
`internal-metadata-takes-a-pool-nullpool-arm-reads-enabled`, which runs after
the call sites hold real pools. Doing it now would silently disable metadata
storage suite-wide.

**Do not** delete `SchemaMigration#connection` here — `MigrationContext#open`
still reads it. It goes in step 2.

## Acceptance criteria

- [ ] `SchemaMigration` and `InternalMetadata` each hold a
      `ConnectionPool | NullPool` and reach connections through
      `withConnection`, mirroring `internal_metadata.rb:41-45` /
      `schema_migration.rb:12-17`.
- [ ] `ConnectionPool#schemaMigration` and `#internalMetadata` pass `this`, not
      `this._getAdapterProxy()`.
- [ ] `_getAdapterProxy()` has no remaining caller in
      `packages/activerecord/src` outside `connection-pool.test.ts`; it is
      **kept** (its own tests and the RFC 0023 story
      `pool-adapter-proxy-makes-sync-adapter-methods-async` still cover it) but
      is no longer on the migration path.
- [ ] `SchemaMigration#_toSql`'s await-the-maybe-Promise hack is gone; `toSql`
      is called on a real connection.
- [ ] `InternalMetadata#tableExists()` answers truthfully when built from a real
      pool — pin it with a test that builds one from a pool and asserts
      `tableExists()` is `true` after `createTable()`. This is the concrete bug
      the proxy caused.
- [ ] The seam constructor arm and `_withConnection` fallback each carry a
      `SEAM (delete in migration-collaborator-call-sites-pass-a-pool)` comment.
- [ ] `InternalMetadata#enabled` is unchanged, deviation note included.
- [ ] No construction site changes. The full suite stays green with no test
      renames.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, single PR from main.
