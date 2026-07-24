---
title: "sti-schema-host-redirect-is-a-trails-invention"
status: in-progress
updated: 2026-07-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5199
claim: "2026-07-23T21:17:11Z"
assignee: "sti-schema-host-redirect-is-a-trails-invention"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review on PR #5170 (`load-schema-own-table-descendant-under-sti-loads-wrong-table`)
and verified against the vendored Rails source.

trails routes schema work for an STI subclass to a "schema host" ancestor —
`stiSchemaHost` in `packages/activerecord/src/model-schema.ts:51`, feeding
`columnsHash`, `cachedColumnsHash`, `attributesBuilder`, `columns`,
`syncStiSubclassAttributeDefinitions`, `loadSchema`, `loadSchemaFromAdapter`,
`reconcileVirtualAttributes`, and `loadSchemaFromCacheSync`.

**Rails has no such redirect.** `load_schema!`
(vendor/rails/activerecord/lib/active_record/model_schema.rb:587-597) always
uses `self.table_name` and stores the result in the class's OWN `@columns_hash`;
`base_class` (vendor/rails/activerecord/lib/active_record/inheritance.rb:271-283)
walks superclasses until `superclass == Base || superclass.abstract_class?` and
has no table-name logic at all. Ruby class ivars are not inherited, so each STI
subclass independently reads `schema_cache.columns_hash(table_name)` — cheap,
because it is the same warm cache entry — and there is nothing to "share".

The redirect exists in trails because JS `static` members ARE inherited through
the prototype chain, so a subclass writing `_columnsHash` / `_attributeDefinitions`
/ `_attributesBuilder` forks state that then drifts from the base. That forking
is what the redirect (and the whole `_attributeDefinitions` overlay machinery:
`rebuildStiSubclassOverlay`, `syncStiSubclassOverlay`, `_stiOverlaySyncedAt`,
`_schemaRevision`) works around.

PR #5170 fixed a bug IN this invented mechanism (own-table descendants under an
STI ancestor reflected the base's table). It deliberately did not remove it.

## Acceptance criteria

- Decide (and record in the story) whether per-class schema state can be made
  own-property-only — e.g. every schema memo written through an accessor that
  asserts `hasOwnProperty` before reading — so each class reflects its own
  `tableName` from the warm schema cache exactly as Rails does.
- If viable: delete `stiSchemaHost` and the redirect at all nine call sites;
  the STI overlay machinery (`rebuildStiSubclassOverlay` /
  `syncStiSubclassOverlay` / `_stiOverlaySyncedAt`) should collapse with it.
- Existing STI suites (`inheritance.test.ts`, `sti-attribute-routing.test.ts`,
  `encrypted-attribute-sti.trails.test.ts`, `model-schema-*.test.ts`) stay
  green, including the own-table-descendant tests added by #5170.
- If NOT viable, the story must state the concrete blocker at a trails/Rails
  `file:line` — this is a deviation story, so it converges or it documents why
  the JS object model makes convergence impossible; it does not get closed
  won't-do.
