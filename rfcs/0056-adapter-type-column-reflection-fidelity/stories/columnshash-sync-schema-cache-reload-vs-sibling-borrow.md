---
title: "Converge sync columnsHash schema-cache reload (remove sibling-borrow workaround)"
status: blocked
updated: 2026-06-16
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc:
  - 0031-schema-cache-always-warm-convergence
est-loc: 120
priority: 40
pr: 3445
claim: "2026-06-16T11:46:09Z"
assignee: "columnshash-sync-schema-cache-reload-vs-sibling-borrow"
blocked-by: "Architecturally blocked: persistent schema cache breaks cold-cache-per-test suite (base/calculations/associations/cache-key, all adapters); trails has no sync DB reflection. See Findings in story. PR #3445 closed. Re-scope behind sync-reflection or as size===0 recovery-store."
---

## Context

Surfaced by PR #3440 (RFC 0030 `columnshash-empty-after-aliased-hash-select`).

trails' sync `loadSchema`/`columnsHash` path (`packages/activerecord/src/model-schema.ts`)
cannot reload a table's columns from the DB synchronously — Rails'
`ActiveRecord::ModelSchema#load_schema` can, via `schema_cache.columns_hash`
hitting the connection when cold. Combined with the test helper
`clearSchemaCache` (`src/test-helpers/with-transactional-fixtures.ts:56`)
wiping the per-connection `SchemaCache` between every test, a model whose
first sync `columnsHash()` lands after a cache clear and has no own
reflection returns an empty hash and un-qualifies its projections.

PR #3440's fix is a trails-specific workaround: `borrowSameTableColumns`
(`model-schema.ts`) copies `_attributeDefinitions` from an already-loaded
same-table sibling on the same connection. It has no Rails counterpart and is
best-effort — it returns null (recurring the empty-synthesize bug) when every
loaded same-table sibling declares its own `ignoredColumns`.

Rails has no sibling-borrow because same-table models share one persistent
schema-cache entry. The faithful convergence is to make trails' schema cache
behave the same: either a synchronous cold-load path, or not clearing
unchanged-table entries between tests (clear only tables touched by DDL, like
Rails' `clear_data_source_cache!`), so a fresh same-table model reads the live
cache entry directly and applies its own `ignoredColumns` at read time.

## Acceptance criteria

- [ ] A fresh same-table model's sync `columnsHash()` returns the table's real
      columns without borrowing from a sibling — sourced from a persistent or
      synchronously-reloadable schema cache entry, matching Rails' shared-cache
      semantics.
- [ ] `borrowSameTableColumns` (and its best-effort `ignoredColumns` caveat) is
      removed once the cache path is faithful, OR a decision is recorded that it
      stays as defense-in-depth with the convergence achieved by the cache path.
- [ ] `relation/select.test.ts` `reselect with default scope select` and the
      `model-schema-columnshash-recovery.test.ts` regression still pass in
      full-file order (SQLite canonical; PG/MySQL per gate).

## Findings — attempt abandoned (2026-06-16, PR #3445 closed)

The prescribed convergence (make trails' schema cache persistent across tests,
so a fresh same-table model reads the live cache entry the way Rails' shared
schema-cache entry serves all same-table models) is **architecturally blocked**
in trails. Two independent walls, both confirmed by CI on PR #3445:

1. **Per-test cache clearing is load-bearing.** `withTransactionalFixtures`
   blanket-clears the per-connection `SchemaCache` on every teardown
   (`with-transactional-fixtures.ts` `clearSchemaCache`). A large class of tests
   defines ad-hoc model classes on _real_ table names (e.g. `class Topic` /
   `class User` on `topics` / `users` in `base.test.ts`, `calculations.test.ts`,
   `associations.test.ts`, `cache-key.test.ts`) and relies on the cache being
   cold so `columnNames()`/`columnsHash()` **synthesize from the model's
   declared `attribute()` set** rather than reflecting the real table. Any
   persistence — full snapshot/restore _or_ the story's suggested
   "clear only DDL-touched tables" (`clear_data_source_cache!`) — preserves the
   real-table warmth and breaks these synthesize-from-attributes assertions.
   CI showed deterministic failures across all three adapters in >=4 files
   (`base:2533/2664`, `calculations:5283`, `associations:2738/2785`,
   `cache-key:349`).

2. **No synchronous DB reflection.** `base.test.ts` "clear cache!" expects
   `columnsHash()` after `resetColumnInformation()` to equal the pre-reset hash
   (Rails reloads from the DB synchronously via `schema_cache.columns_hash`).
   trails' drivers are async, so after the reset clears the table entry the sync
   path can only synthesize from attribute defs. The test only "passed"
   pre-change because `clear()` kept _both_ sides cold (minimal). Persistence
   makes the pre-reset side full and exposes the irreducible sync/async gap —
   the same gap `borrowSameTableColumns` exists to paper over.

**Conclusion:** faithful convergence requires synchronous schema reflection (or
a redesign of the test cache-clearing contract) — neither is in scope here.
`borrowSameTableColumns` stays as defense-in-depth. A viable _narrower_ path
(not pursued, available if re-scoped): an `@internal` per-adapter store of
reflected column names that survives `clear()` and is consulted **only** in the
`_attributeDefinitions.size === 0` cold-recovery branch (where borrow already
fires) — this fixes borrow's best-effort `ignoredColumns` null-gap and matches
AC1's "synchronously-reloadable" wording **without** disturbing the
cold-cache-per-test behavior the suite depends on.
