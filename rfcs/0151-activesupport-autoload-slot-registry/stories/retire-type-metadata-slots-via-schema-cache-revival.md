---
title: "Retire type-metadata-slots.ts and SqlTypeMetadata.fromJSON: schema-cache revives metadata like Column"
status: done
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 19
pr: trails#8053
claim: "2026-09-24T23:47:57Z"
assignee: "converge-connection-adapters-slot-onto-namespace"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/type-metadata-slots.ts` exists only so
`SqlTypeMetadata.fromJSON` (`sql-type-metadata.ts`, receipt CONVERGEABLE
`converge-adapter-schema-and-result-helper-surface-remainder`) can revive a dumped
metadata by class tag without importing its subclasses. Rails has no such reviver:
Psych resolves the `!ruby/object:` tag and restores ivars, and `Column#init_with`
(`column.rb:46-54`) receives the revived object.

Since trails#8033 the class tag is written by `serializeColumn` in
`connection-adapters/schema-cache.ts` from a `TYPE_METADATA_CLASSES` table that
already imports both `mysql/type-metadata.ts` and `postgresql/type-metadata.ts`.
`rehydrateColumn` still calls `SqlTypeMetadata.fromJSON` for the reverse.

## Converged shape

`rehydrateColumn` revives metadata from `TYPE_METADATA_CLASSES[coder.class]`
(`Object.create(klass.prototype)` + ivar assign, the Psych default object arm,
exactly as it already revives `Column` from `COLUMN_CLASSES`).
`SqlTypeMetadata.fromJSON`, `SqlTypeMetadataJSON`/`TypeMetadataJSON` and
`type-metadata-slots.ts` are deleted.

## Acceptance criteria

- `fromJSON` and `type-metadata-slots.ts` gone; CLAUDE.md slot list updated.
- MySQL/PostgreSQL column round-trip trails tests still pass through `SchemaCache`.
- `sql-type-metadata.js`, `mysql/type-metadata.js`, `postgresql/type-metadata.js`
  load as plain-node entry modules.
