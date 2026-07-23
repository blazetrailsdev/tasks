---
title: "resetColumnInformation base path leaves descendants' own schema memos stale — Rails reload_schema_from_cache recurses"
status: claimed
updated: 2026-07-23
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 0
pr: null
claim: "2026-07-23T16:58:39Z"
assignee: "reset-column-information-not-recursive-over-descendant-memos"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5140. Rails `reload_schema_from_cache(recursive = true)` recurses
over `subclasses`, nil-ing every descendant's schema memos
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:553-568`), and
`reset_column_information` calls it. trails' `resetColumnInformation`
(`packages/activerecord/src/model-schema.ts`) base path clears only the base's
own caches and bumps `_schemaRevision` — descendants' OWN cache props
(`_columnsHash`, `_columns`, `_attributesBuilder`,
`_returningColumnsForInsertCache`, `_cachedDefaultAttributes`, `_schemaLoaded`)
survive a base reset and serve stale data until the subclass itself reloads.
Subclasses acquire own props via `ignoredColumns=` (whose
`reloadSchemaFromCache`, same file, already implements the descendant own-prop
deletion loop to reuse) or direct assignment. The STI overlay resync
(`syncStiSubclassAttributeDefinitions`) covers `_attributeDefinitions` only,
not these memos.

## Acceptance criteria

- `resetColumnInformation`'s non-STI (base) path deletes descendants' own
  schema-memo props, mirroring Rails' recursive `reload_schema_from_cache`
  (share the loop with `reloadSchemaFromCache`).
- A test: subclass owning `_columns` (e.g. after its own `ignoredColumns=`)
  re-reflects after `resetColumnInformation` on the base.
