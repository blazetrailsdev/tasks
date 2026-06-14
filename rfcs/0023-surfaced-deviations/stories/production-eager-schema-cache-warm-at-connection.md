---
title: "Eagerly warm schema cache at connection/boot in production (not just defineSchema)"
status: ready
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by columnnames-sync-virtual-exclusion (PR #3268, RFC 0016). That story
fixed the synchronous `Model.columnNames()` cold-cache virtual-attribute gap by
eagerly warming the adapter schema cache — but only in the **test helper**
`defineSchema(schema)` (`test-helpers/define-schema.ts:_warmSchemaCache`), the
test-suite analogue of Rails loading `db/schema_cache.yml` at boot.

In production there is no equivalent eager DB-introspection warm. A real app
calling `Model.columnNames()` / `columnsHash()` synchronously before any query —
with no `schema_cache.json` on disk (the only existing prod warm, via
`SchemaReflection.lazilyLoadSchemaCache`) — still hits the cold synthesized
branch in `model-schema.ts` `columnsHash()` and can include virtual
`attribute()` declarations. Rails avoids this because `column_names` performs a
synchronous blocking schema load on first access; trails' async layer cannot.

Two interacting limitations to consider:

- No DB-introspection warm at connection establishment (analogue of Rails
  synchronous reflection / `schema_cache.addAll(pool)`).
- `resetColumnInformation` clears the adapter data-source cache and cannot
  synchronously reload, so even a previously-warm model goes cold after a reset
  (also why transactional-fixtures suites clear the cache per test).

## Acceptance criteria

- A synchronous `Model.columnNames()` on a connected production model with a
  real table excludes virtual attributes without a prior
  `await ensureSchemaLoaded()` and without a committed `schema_cache.json`,
  via eager warming at connection/boot (closest Rails analogue).
- Decide and document whether/how the warm is re-established after
  `resetColumnInformation`, or accept it as the documented async limitation.
