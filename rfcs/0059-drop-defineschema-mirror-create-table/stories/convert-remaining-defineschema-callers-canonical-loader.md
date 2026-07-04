---
title: "convert-remaining-defineschema-callers-canonical-loader"
status: ready
updated: 2026-07-04
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). Follow-up carved out of the
terminal story `retire-defineschema-and-one-schema-apparatus`. **Guiding
principle: Rails fidelity above all else.**

Convert the remaining non-fixtures `defineSchema` call-sites onto the canonical
loader (`loadCanonicalSchema` / `rebuildCanonicalTables` in
`test-helpers/canonical-schema.ts`):

- `test-helpers/setup-second-pool.ts:76-77` — lays bespoke `ARUNIT2_SCHEMA`
  (colleges/courses/professors/courses_professors) + `PRIMARY_SCHEMA`
  (entrants) with `dropExisting`. All are canonical tables → replace with
  `rebuildCanonicalTables(arunit2, [...])` / `rebuildCanonicalTables(primary,
["entrants"])` (more Rails-faithful than the subset shapes).
- `test-helpers/setup-adapter-suite.ts:96` — `defineSchema(...)` +
  `DefineSchemaOpts` import.
- `test-helpers/schema-repair.ts:147` —
  `defineSchema(adapter, { [table]: canonical[table] }, { dropExisting: true })`
  → `rebuildCanonicalTables(adapter, [table])`.
- `encryption/test-helpers.ts:174` (`installEncryptionSchema`) — lays 4 canonical
  tables (posts/encrypted_books/authors/traffic_lights) via `defineSchema`
  against `Base.connection` (already schema-loaded → ensure-exists). Needs the
  same idempotent-ensure treatment as use-fixtures (dep on that story) or a safe
  no-drop equivalent; `rebuildCanonicalTables` would drop shared tables.

## Acceptance criteria

- None of the four files call `defineSchema`.
- Second-pool tables keep the Rails schema.rb shapes; MultipleDbTest still passes.
- `test:compare` delta >= 0; no test renames. NO node:_/process._; async fs only.
