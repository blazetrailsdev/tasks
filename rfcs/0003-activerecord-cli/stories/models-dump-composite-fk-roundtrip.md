---
title: "trails-models-dump: composite-FK synthesized name round-trip"
status: draft
rfc: "0003-activerecord-cli"
cluster: deferred
deps: []
deps-rfc: []
est-loc: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Residual from the (now-retired) `trails-models-dump-schema-ts-migration.md`,
folded here during the RFC 0011 cutover (the schema.ts migration itself is
complete — #2851/#2861/#2889/#2895/#2896). When `trails-models-dump` reads a
composite FK from `db/schema.ts`, `parseSchemaTs`
(`activerecord-cli/src/tsc-wrapper/schema-ts-parser.ts:182`) synthesizes a name
`fk_rails_${fromTable}_${col}` because the dumper omits `name:` for
Rails-auto-named FKs (`isExportNameOnSchemaDump`, `schema-dumper.ts:1113-1117`).
That synthesized name **does not match** Rails' `/^fk_rails_[0-9a-f]{10}$/`
shape, so on a subsequent `ar db:schema:dump` it would be re-emitted as an
explicit `name:` instead of being suppressed — i.e. it does not round-trip.

Harmless today: `generateModels` reads `fk.name` **only** inside the composite-FK
TODO (`model-codegen.ts:241`); `belongsTo`/`hasMany` names derive from
`fk.column`/`toTable`, so the fabricated name never leaks into associations.
**Low priority — `deferred` because it's a documented limitation, not a bug.**

## Do as Rails does

Rails auto-names FKs `fk_rails_<10hex>` (a hash of table+column, see
`connection_adapters/abstract/schema_statements.rb#foreign_key_name`) and omits
`name:` from `schema.rb` when the name matches that shape. To round-trip, the
synthesized name must either reproduce Rails' hash shape (so the dumper's
suppression matches) or codegen must stop depending on a synthesized `name` at
all.

## Acceptance criteria

- [ ] Either: synthesized composite-FK names match Rails' `fk_rails_<10hex>`
      shape so they round-trip through `SchemaDumper` (re-dump suppresses
      `name:`), OR codegen at `model-codegen.ts:241` is reworked to not need a
      synthesized `name` (derive purely from `column`/`toTable`).
- [ ] The `model-codegen.ts:241` composite-FK TODO is resolved or its
      intentional codegen-only scope is annotated in code.
- [ ] No change to association names (they already derive from column/toTable).

## Notes

Pure `activerecord-cli` codegen nicety; no runtime AR impact. Bundle into an
adjacent `trails-models-dump` PR if one is in flight.
