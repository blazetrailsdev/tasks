---
title: "Every SchemaMigration/InternalMetadata call site passes a pool; delete the seam (step 2 of 2)"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: ["migration-collaborators-hold-a-pool-and-reach-connections-through-it"]
deps-rfc: []
est-loc: 400
priority: 131
pr: 6261
claim: "2026-08-08T20:04:41Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

**Step 2 of 2** in the adapter-vs-pool convergence for `SchemaMigration` /
`InternalMetadata`. Step 1
(`migration-collaborators-hold-a-pool-and-reach-connections-through-it`) moved
both classes onto a pool behind a compatibility seam that still accepts an
adapter. This story flips every construction site to pass a pool and **deletes
the seam**, which is what makes the divergence actually gone rather than
merely wrapped.

### Measured on `origin/main`

`git grep -c` across `packages/` and `scripts/`:

- `new SchemaMigration(` — **103** sites
- `new InternalMetadata(` — **95** sites

Of the 198 total, **159 are literally `new X(adapter)`** where `adapter` is a
local, and the two classes are overwhelmingly constructed as an adjacent pair
at the same call site. The remaining argument spellings are `Base.connection`
(10), `realAdapter` (6), `await …` (5), `adapterA`/`adapterB` (8),
`this._getAdapterProxy()` (2, already removed by step 1), `testAdapter` (2),
`ctx.adapter` (2), `connection` (2), `seedAdapter` (1).

**Only 29 of the 198 are production code**; the rest are tests. The production
set is small and enumerable:

- `packages/activerecord/src/tasks/database-tasks.ts` — `:369,:384,:1429,:1642`
  (SchemaMigration), `:370,:385,:1050,:1380` (InternalMetadata)
- `packages/trailties/src/commands/db.ts` — `:385,:603,:665` /
  `:386,:604,:666,:790`
- `packages/activerecord/src/schema.ts` — `:74` / `:98`
- `packages/activerecord/src/schema-dumper.ts` — `:527`
- `packages/activerecord/src/test-databases.ts` — `:30` / `:31`
- `packages/activerecord/src/support/canonical-schema-stamp.ts` —
  `:136,:172,:195`
- `packages/activerecord-cli/src/pending-migrations.ts` — `:21` / `:22`
- `packages/website/src/lib/frontiers/trail-cli.ts` — `:154` / `:155`

### Why this is one PR and not ten

The edit is `new X(adapter)` → `new X(adapter.pool)` at nearly every site: one
token per line, ~198 changed lines, plus the class-side seam deletion and
whatever pool plumbing the genuinely pool-less sites need. That lands inside the
**700-LOC** ceiling.

Note for anyone reading the older blocked-by reasons on the sibling stories:
they cited "~50", "~42" and "101 sites … far past this bundle's 500 LOC
ceiling". The counts were undercounts of the raw total but massive
**over**counts of the _work_, because they did not separate the 159 mechanical
one-token sites from the handful that need real thought, and they were measured
against a 500-LOC ceiling that is now 700.

### The sites that need thought

`AbstractAdapter#pool` is never null — the constructor seeds a `NullPool`
(`abstract-adapter.ts:866`, mirroring `abstract_adapter.rb:153`) — so
`adapter.pool` **always type-checks**. The sites that need work are the ones
where that pool is a `NullPool`, because `NullPool#checkout()` throws
`ConnectionNotEstablished` and `withConnection` cannot serve them once the
seam's fallback arm is gone. Those sites are the bare
`new BetterSQLite3Adapter(path)` constructions, concentrated in
`tasks/database-tasks.test.ts`, `tasks/sqlite-database-tasks.test.ts`,
`tasks/database-tasks-truncate-tables.trails.test.ts` and
`tasks/database-tasks-protected-environments-env.trails.test.ts`.

Give each of those a real pool via the existing test factory
(`test-adapter.ts`'s `createPooledTestAdapter`, which builds a `PoolConfig` +
`ConnectionPool` and returns `pool.leaseConnection()`) — the same move that
`raw-test-adapters-should-come-from-pool-checkout`,
`template-global-setup-adapters-carry-a-real-pool` and
`database-tasks-adapters-carry-a-real-pool` already made everywhere else. Do
**not** re-add a NullPool escape hatch to the collaborators; that is the seam
this story exists to delete.

### Recommended order inside the PR

1. Delete the seam's fallback arm and adapter-accepting constructor overload —
   the type error at every remaining adapter-passing site is now the worklist.
2. Walk the 29 production sites.
3. Walk the test sites; run the suite and let `ConnectionNotEstablished` find
   the genuinely pool-less ones.
4. Delete `SchemaMigration#connection` (or reduce it to what
   `MigrationContext#open` still needs — `migration-context-collaborators-need-a-pool`
   removes the last reader).

## Acceptance criteria

- [ ] `SchemaMigration` and `InternalMetadata` constructors take only a
      `ConnectionPool | NullPool`; the adapter-accepting overload is gone.
- [ ] Both `SEAM (delete in migration-collaborator-call-sites-pass-a-pool)`
      comments and the `_fallbackAdapter` field are gone — `git grep SEAM` over
      `schema-migration.ts` and `internal-metadata.ts` is empty.
- [ ] Every construction site in `packages/` and `scripts/` passes a pool;
      `git grep -E 'new (SchemaMigration|InternalMetadata)\(adapter\)'` is
      empty.
- [ ] `SchemaMigration#connection` is deleted, or reduced to exactly what
      `MigrationContext#open` still requires with the `@internal` note updated
      to say so.
- [ ] No test that previously exercised metadata storage now silently skips it:
      `InternalMetadata#enabled` still carries its softened arm (converging it
      is `internal-metadata-takes-a-pool-nullpool-arm-reads-enabled`, next), so
      a site that accidentally kept a NullPool would fail loudly on
      `checkout()`, not quietly disable itself.
- [ ] Full suite green, no test renames.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, single PR from main.
