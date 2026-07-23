---
title: "load-schema-own-table-descendant-under-sti-loads-wrong-table"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-23T20:35:50Z"
assignee: "load-schema-own-table-descendant-under-sti-loads-wrong-table"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `reload-schema-recursion-misses-non-sti-under-sti` (PR #5168, which
fixed the _invalidation_ half). The _load_ path has the identical own-table
conflation and is untouched:

- `loadSchema` (packages/activerecord/src/model-schema.ts:1064):
  `const workHost = isStiSubclass(this) ? getStiBase(this) : this` — marks the
  STI base `_schemaLoaded`, not the descendant.
- `loadSchemaFromCacheSync` (model-schema.ts:1594): `const schemaHost =
isStiSubclass(host) ? getStiBase(host) : host`, then `const table =
schemaHost.tableName` (1611) and `applyColumnsHash(schemaHost, ...)` (1616).

For an own-table descendant nested under an STI ancestor (Shape→Circle→Ticket,
where Ticket sets its own `table_name = "tickets"`), `isStiSubclass(Ticket)` is
true (`_inheritanceColumn` propagates via the prototype chain), so both paths
redirect to `getStiBase(Ticket)` = Shape and reflect Shape's `"shapes"` table
onto Shape — Ticket's own `"tickets"` columns are never loaded. PR #5168's fix
makes `reload_schema_from_cache` correctly bump Ticket's revision / clear its
`_schemaLoadPromise`, but the subsequent `loadSchema()` still reflects the
wrong table.

The invalidation fix already added `sharesStiBaseTable(klass)`
(model-schema.ts, true only when `getStiBase(klass).tableName ===
klass.tableName`). The load path should gate its `getStiBase` redirect the same
way: only redirect to the STI base when the table is actually shared; an
own-table descendant must reflect (and mark `_schemaLoaded` on) itself.

This is riskier than the invalidation fix because the redirect underpins the
STI shared-`_attributeDefinitions`-Map overlay design — an own-table descendant
arguably should NOT share the base's defs Map at all (different table, different
columns). Needs care around `applyColumnsHash`'s `originatingHost` arg and the
`_schemaLoaded`-on-base prototype-inheritance invariant.

## Acceptance criteria

- An own-table descendant under an STI ancestor loads its OWN table's columns
  (regression test asserting the adapter is queried with the descendant's table
  name, or that its `_columnsHash` reflects its own columns — must fail on
  current main and after PR #5168).
- Genuine STI subclasses (shared table) still redirect to the base and share
  its defs Map — existing STI load/reflection suites stay green.
- No forked `_attributeDefinitions` regression for shared-table STI subclasses.
