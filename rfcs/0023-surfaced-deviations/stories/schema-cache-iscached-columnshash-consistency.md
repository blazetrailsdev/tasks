---
title: "SchemaCache.isCached checks _columns but readers use _columnsHash — make consistent"
status: in-progress
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3387
claim: "2026-06-15T18:12:28Z"
assignee: "schema-cache-iscached-columnshash-consistency"
blocked-by: null
---

## Context

Surfaced in review of columnnames-sync-virtual-exclusion (PR #3268). `SchemaCache`
tracks two maps: `_columns` and `_columnsHash`. `isCached(table)` checks
`_columns.has(table)` (`connection-adapters/schema-cache.ts:172`), but the sync
read path `model-schema.ts` `columnsHash()` gates on `cache.isCached(table)` and
then reads `cache.getCachedColumnsHash(table)` (which reads `_columnsHash`). If
`_columns` is populated without a corresponding `_columnsHash` entry, `isCached`
returns true, `getCachedColumnsHash` returns `undefined`, and `columnsHash()`
falls through to the synthesized branch — re-introducing the virtual-attribute
leak the warm was meant to prevent.

In practice `setColumns` populates both maps together, so the two are usually in
sync; this is a latent consistency hazard, not a known live bug. A dedicated
`isColumnsHashCached(pool, table)` already exists (`schema-cache.ts:277`).

## Acceptance criteria

- `model-schema.ts` `columnsHash()` (and any other reader of
  `getCachedColumnsHash`) gates on a check of the same map it reads — either
  switch the guard to `isColumnsHashCached`, or guarantee `_columns` and
  `_columnsHash` are always populated/cleared together (with a test).
- No regression in api:compare / test:compare.
