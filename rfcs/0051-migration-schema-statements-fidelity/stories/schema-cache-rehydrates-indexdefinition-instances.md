---
title: "Schema cache rehydrates IndexDefinition instances, not plain rows"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5890
claim: "2026-08-02T15:41:57Z"
assignee: "schema-cache-rehydrates-indexdefinition-instances"
blocked-by: null
closed-reason: null
---

## Context

PR #5877 made every adapter's `indexes()` return real `IndexDefinition`
instances. The schema cache does not preserve them: `SchemaCache#initWith`
(`packages/activerecord/src/connection-adapters/schema-cache.ts:165-168`) and
`fromArray` (`:641`) rehydrate `_indexes` from plain JSON objects, and
`_indexes` is typed `Map<string, unknown[]>` (`:77`), so a cache round-trip
silently downgrades each `IndexDefinition` to a structural object.

Rails' schema cache round-trips real `IndexDefinition` structs (the YAML/Marshal
payload carries the class), so `index.columnOptions()` / `index.isDefinedFor()`
keep working after a `schema_cache.yml` load. In trails those methods are absent
on a cache-loaded index, so any consumer that reaches for derived behavior
breaks only on the cached path — a latent divergence, not currently exercised
because today's consumers read plain fields.

`trailties`' `db schema:cache:dump` test
(`packages/trailties/src/commands/db.test.ts`) pins the serialized shape, which
now includes `lengths` / `opclasses` / `valid`.

## Acceptance criteria

- `SchemaCache#initWith` / `fromArray` reconstruct `IndexDefinition` instances
  from the serialized rows rather than leaving plain objects.
- `_indexes` is typed as `IndexDefinition[]`, not `unknown[]`.
- A test asserts a dumped-then-loaded cache yields an index whose
  `columnOptions()` / `isDefinedFor()` behave the same as the live-reflected one.
