---
title: "Re-establish eager schema cache warm after resetColumnInformation (sync cold-after-reset gap)"
status: ready
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 39
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `production-eager-schema-cache-warm-at-connection` (PR #3373, RFC
0023). That story added `SchemaReflection.eagerLoadSchemaCache` — an opt-in
DB-introspection warm at connection/boot (the production analogue of Rails'
`schema_cache.addAll(pool)`) — so a synchronous `Model.columnNames()` /
`columnsHash()` on a connected model takes the warm, DB-sourced branch and
excludes virtual `attribute()` declarations without a prior
`await ensureSchemaLoaded()`.

That fix only covers the _initial_ connection/boot warm. The
`resetColumnInformation` re-warm was explicitly accepted as a documented async
limitation (see the `eagerLoadSchemaCache` JSDoc in
`connection-adapters/schema-cache.ts`): `resetColumnInformation`
(`model-schema.ts`) clears the per-table adapter data-source cache entry and
cannot synchronously reload it. So even a model that was eagerly warmed at boot
goes cold for that table after a reset, and the next synchronous
`columnNames()` can again include virtual attributes until an async schema load
re-warms it. This is also why transactional-fixtures suites clear the cache per
test.

Rails avoids this because `reset_column_information` is followed by a
synchronous blocking reload on next `column_names` access; trails' async layer
cannot block.

## Acceptance criteria

- Decide and implement how the eager warm is re-established after
  `resetColumnInformation` for a connected model under
  `eagerLoadSchemaCache`, so a subsequent synchronous `Model.columnNames()`
  again excludes virtual attributes without an intervening
  `await ensureSchemaLoaded()` — or, if it remains an accepted async
  limitation, capture that decision with concrete reasoning and close as
  tracked-pending-convergence rather than silently leaving the JSDoc note.
- No `node:*` imports, no `process.*`, async fs only.
