---
title: "InternalMetadata takes an adapter where Rails takes a pool, so the NullPool arm reads as enabled"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps:
  - migration-collaborator-call-sites-pass-a-pool
deps-rfc: []
est-loc: 200
pr: 6270
claim: "2026-08-09T01:30:48Z"
assignee: "port-sqlite-rake-create-drop-charset-collation-tests"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::InternalMetadata`'s `enabled?` reads straight off its pool
(`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:35-36`):

```ruby
def enabled?
  @pool.db_config.use_metadata_table?
end
```

PR #6122 converged the _source_ of the flag — trails no longer requires an
explicit `{ enabled }` constructor option, and `InternalMetadata#enabled`
(`packages/activerecord/src/internal-metadata.ts`) now reads
`adapter.pool.dbConfig.useMetadataTable`. **One arm stays divergent**, and is
cited in a deviation note on the getter:

```ts
get enabled(): boolean {
  const pool = this._connection.pool as { dbConfig?: { useMetadataTable?: boolean } } | null;
  return pool?.dbConfig?.useMetadataTable !== false;
}
```

A `NullPool` answers `NULL_CONFIG`
(`connection-adapters/abstract/connection-pool.ts`), whose every key is
undefined — the analogue of Rails' `NullConfig#method_missing` returning nil
(`abstract/connection_pool.rb:17-22`). Rails would therefore read a
NullPool-backed `InternalMetadata` as **disabled**. trails reads it as
**enabled**, because the `!== false` softening treats `undefined` as "on". That
softening exists only because trails built `InternalMetadata` over bare,
NullPool-backed adapters throughout the suite; making the arm faithful while
those sites existed would have silently disabled metadata storage suite-wide.

## Re-scoped 2026-08-08 — this is now a small story

This story previously carried `est-loc: 200` and owned the whole constructor
migration ("the ~42 `new InternalMetadata(adapter)` construction sites"). **That
work has been split out and now runs ahead of this story**, as
`migration-collaborators-hold-a-pool-and-reach-connections-through-it`
(step 1) and `migration-collaborator-call-sites-pass-a-pool` (step 2). By the
time this story is picked up, `InternalMetadata` already takes a
`ConnectionPool | NullPool` and every construction site already hands it a real
pool.

So all that is left here is the arm itself: **delete the softening, delete the
note, delete the test stub that exists to work around it.**

The 2026-08-07 re-verification of the old reason still stands on its facts and
is folded in: `AbstractAdapter#pool` is no longer `pool: unknown` — PR #6128
typed it `ConnectionPool | NullPool` (`abstract-adapter.ts:866`) — so the "every
site needs an `as ConnectionPool` cast" argument was already dead then. The
live half was the construction sites, which steps 1 and 2 now own.

## Converged shape

```ts
get enabled(): boolean {
  return this._pool.dbConfig.useMetadataTable;
}
```

No `pool == null` arm, no `!== false` softening. A `NullPool` reads as disabled
exactly as it does in Rails, because `NULL_CONFIG.useMetadataTable` is
undefined.

`db.test.ts`'s `disableMetadataTable` helper — which stubs `adapter.pool` with a
bare `{ dbConfig: { useMetadataTable: false } }` — exists only to route around
the adapter-vs-pool gap and should disappear with the fix: those tests turn the
flag off through a real `db_config` instead.

## Acceptance criteria

- [ ] `enabled` is the bare `@pool.db_config.use_metadata_table?`
      (`internal_metadata.rb:35-36`) with no extra arms.
- [ ] The deviation note on the `enabled` getter is **deleted, not reworded** —
      there is no longer a deviation to describe.
- [ ] `db.test.ts`'s `disableMetadataTable` pool stub is gone; those tests turn
      the flag off through a real db_config.
- [ ] A test pins the NullPool arm: an `InternalMetadata` built over a
      `NullPool` reads as **disabled**, matching Rails.
- [ ] `migration.test.ts` "internal metadata not used when not enabled" and the
      trailties metadata suites stay green with no test renames.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, single PR from main.
