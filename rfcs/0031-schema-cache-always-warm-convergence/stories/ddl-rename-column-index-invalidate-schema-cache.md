---
title: "renameColumn/renameIndex must invalidate the schema cache (always-warm latent staleness)"
status: in-progress
updated: 2026-06-23
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3985
claim: "2026-06-23T12:22:41Z"
assignee: "ddl-rename-column-index-invalidate-schema-cache"
blocked-by: null
---

## Context

RFC 0031 R1 (PR #3856) made the per-connection `SchemaCache` always-warm +
persistent in the AR test harness. Under that posture any DDL method that
mutates a table must invalidate the cached reflection, or a stale entry is
served to the next sync `columnsHash()`/`indexes` read. R1 closed the gaps that
surfaced: SQLite `addColumn`, `Model.createTable`, and `changeColumnDefault`
(all adapters).

An audit of `connection-adapters/abstract/schema-statements.ts` found two DDL
methods that still never call `clearDataSourceCacheBang`:

- `renameColumn` (abstract:393) — leaves the OLD column name in `_columns` /
  `_columnsHash`; a post-rename `columnsHash()` reports the stale name.
- `renameIndex` (abstract:881) — leaves the OLD index name in `_indexes`.

Verified NOT affected: `addReference`/`removeReference`/`addTimestamps` delegate
to `addColumn`/`removeColumn` (covered transitively); `addForeignKey`/
`removeForeignKey` touch nothing the `SchemaCache` stores (it caches columns /
columnsHash / primaryKeys / dataSourceExists / indexes, not FKs).

Pre-R1 the blanket per-test `schemaCache.clear()` masked this; with the
persistent cache it is latent staleness. CI did not catch it because no test
does rename-then-sync-read through the always-warm cache.

Adapter overrides of `renameColumn`/`renameIndex` (PostgreSQL/MySQL/SQLite) must
be checked too — each override that issues its own DDL needs the same clear, the
way R1 had to fix the PG/MySQL/SQLite `changeColumnDefault` overrides
individually (the adapter method shadows the abstract one).

## Acceptance criteria

- [ ] `renameColumn` invalidates the touched table's schema-cache entry
      (`clearDataSourceCacheBang`) before mutating, in the abstract method AND
      every adapter override (PG/MySQL/SQLite), matching the sibling DDL methods.
- [ ] `renameIndex` invalidates likewise (abstract + overrides).
- [ ] A test (in the always-warm harness) asserts a sync `columnsHash()` after
      `renameColumn`, and `indexes` after `renameIndex`, reflects the new name
      and not the stale one.
- [ ] Green on SQLite canonical; PG/MySQL per gate.
