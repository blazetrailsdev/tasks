---
title: "model-schema-hardcoded-config-toggles-converge"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4060
claim: null
assignee: null
blocked-by: null
---

## Context

`ActiveRecord::ModelSchema` declares four `class_attribute` config toggles that
Rails lets callers set, but trails currently **hardcodes** the underlying
behavior — so exposing a settable accessor without wiring it would be a silent
divergence. These were skip-listed (with this story referenced) in
`scripts/api-compare/conventions.ts` by `ar-base-core-model-schema-config`
rather than skip-ratified:

- `pluralize_table_names` (`model_schema.rb:168`, default `true`): trails always
  pluralizes in `model-schema.ts` `undecoratedTableName` (line ~69) and always
  singularizes the contained-class prefix in `containedTableNamePrefix`
  (line ~82, documented at lines 78-80). No runtime toggle.
- `schema_migrations_table_name` (`model_schema.rb:166`, default
  `"schema_migrations"`): hardcoded as the literal string in `migrator.ts`
  (`new Table("schema_migrations")`, `CREATE TABLE ... "schema_migrations"`) and
  `schema-migration.ts` (`TABLE_NAME = "schema_migrations"`).
- `internal_metadata_table_name` (`model_schema.rb:167`, default
  `"ar_internal_metadata"`): hardcoded in `internal-metadata.ts` / `migration.ts`.
- `immutable_strings_by_default` (`model_schema.rb:170`, default nil): trails has
  no immutable-string attribute type, so there is no behavior to toggle.

## Acceptance criteria

- Wire each toggle to genuine class-level config that the relevant code path
  reads (table-name inference reads `pluralizeTableNames`; the migrator /
  schema-migration / internal-metadata classes read the configurable table
  names; string-type resolution honors `immutableStringsByDefault`).
- Where a feature is genuinely absent (`immutable_strings_by_default`), either
  implement the immutable-string type or document the gap as an accepted
  deviation with the Rails behavior it omits.
- Remove the corresponding entry from `SKIP_GROUPS` in
  `scripts/api-compare/conventions.ts` and keep `api:compare` at 100%.
- Tests match Rails verbatim.
