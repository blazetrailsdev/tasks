---
title: "pg-excl-unique-export-name-flag-strip"
status: done
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5167
claim: "2026-07-23T17:25:37Z"
assignee: "pg-excl-unique-export-name-flag-strip"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #5163 (fk-chk-export-name-hardcodes-ignore-pattern). That PR
made the abstract `ForeignKeyDefinition`/`CheckConstraintDefinition`
`isExportNameOnSchemaDump` getters strip `g`/`y` flags before `.test()` via a
`statelessTest` helper in
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`,
mirroring the same guard `packages/activerecord/src/schema-dumper.ts:1049-1051,
1080-1083` already applies in its fallback paths.

The two PG constraint getters still call `.test()` on the raw stored pattern:
`ExclusionConstraintDefinition.exportNameOnSchemaDump`
(packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts:100,
`SchemaDumper.exclIgnorePattern.test(...)`) and
`UniqueConstraintDefinition.exportNameOnSchemaDump` (same file, :136,
`.uniqueIgnorePattern.test(...)`). A user-configured `exclIgnorePattern` /
`uniqueIgnorePattern` carrying a `g`/`y` flag would alternate true/false across
repeated calls — the exact footgun #5163 fixed for the abstract getters. Rails'
`export_name_on_schema_dump?` for these types
(vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:209,231)
uses `Regexp#match?`, which is stateless.

## Acceptance criteria

- Both PG getters route through a stateless g/y-flag-stripping test, sharing one
  helper with the abstract getters (hoist `statelessTest` into schema-dumper.ts
  or a shared util both files import — avoid a second copy).
- Test: a custom `SchemaDumper.exclIgnorePattern` / `uniqueIgnorePattern` with a
  `g` flag yields stable results across repeated getter calls (reset in
  afterEach).
