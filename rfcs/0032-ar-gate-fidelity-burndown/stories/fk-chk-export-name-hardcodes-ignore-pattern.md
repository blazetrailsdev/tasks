---
title: "FK/check export-name getters hardcode ignore pattern instead of reading SchemaDumper attrs"
status: done
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5163
claim: "2026-07-23T17:07:38Z"
assignee: "fk-chk-export-name-hardcodes-ignore-pattern"
blocked-by: null
closed-reason: null
---

# fk-chk-export-name-hardcodes-ignore-pattern

## Context

Found during check-parts-name-ignores-chk-pattern (PR #5156). Rails'
`ForeignKeyDefinition#export_name_on_schema_dump?` and
`CheckConstraintDefinition#export_name_on_schema_dump?` read the configurable
class attributes `ActiveRecord::SchemaDumper.fk_ignore_pattern` /
`.chk_ignore_pattern` at call time
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:150-152,185-187),
so a user-configured pattern is honored.

Trails hardcodes the default regex in both getters:
`ForeignKeyDefinition.isExportNameOnSchemaDump`
(packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:280-282,
`/^fk_rails_[0-9a-f]{10}$/`) and
`CheckConstraintDefinition.isExportNameOnSchemaDump` (same file, ~:352,
`/^chk_rails_[0-9a-f]{10}$/`). Trails' own PG definitions already do it right:
`ExclusionConstraintDefinition.exportNameOnSchemaDump` /
`UniqueConstraintDefinition.exportNameOnSchemaDump` read
`SchemaDumper.exclIgnorePattern` / `.uniqueIgnorePattern` dynamically
(packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts:99-101,135-137).
The dump-path fallbacks in `checkParts` / `foreignKeys`
(packages/activerecord/src/schema-dumper.ts) also read the class attrs, so
only definition objects carrying the getter ignore a configured pattern.

## Acceptance criteria

- Both abstract getters read `SchemaDumper.fkIgnorePattern` /
  `.chkIgnorePattern` at call time (mind circular-import risk between
  schema-definitions.ts and schema-dumper.ts — the PG file imports
  SchemaDumper already; verify the abstract file can too, else thread the
  pattern in).
- Test: setting a custom `SchemaDumper.fkIgnorePattern` /
  `chkIgnorePattern` changes the getter result (reset in afterEach).
