---
title: "trails-models-dump: composite-FK synthesized name round-trip"
status: done
updated: 2026-06-14
rfc: "0003-activerecord-cli"
cluster: deferred
deps: []
deps-rfc: []
est-loc: 30
priority: 30
pr: 3003
claim: "2026-06-07T19:19:52Z"
assignee: "models-dump-composite-fk-roundtrip"
blocked-by: null
---

## Context

Residual from the (now-retired) `trails-models-dump-schema-ts-migration.md`,
folded here during the RFC 0011 cutover (the schema.ts migration itself is
complete — #2851/#2861/#2889/#2895/#2896). Still live as of 2026-06-05 — and
explicitly pinned by a test (`schema-ts-model-parser.test.ts:105-106` asserts the
synthesized name is `"fk_rails_reviews_book_id"`, "codegen-only"). When the
schema-ts parser reads a composite FK from `db/schema.ts`, it synthesizes a name
`fk_rails_${fromTable}_${column}`
(`packages/activerecord-cli/src/tsc-wrapper/schema-ts-model-parser.ts:130`,
falling back only when no explicit `name:` is present) because the dumper omits
`name:` for Rails-auto-named FKs — the `isExportNameOnSchemaDump` getter
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:152`,
`return !/^fk_rails_[0-9a-f]{10}$/.test(this.name)`), consumed by the dumper at
`packages/activerecord/src/schema-dumper.ts:1179-1182` against the
`fkIgnorePattern` `/^fk_rails_[0-9a-f]{10}$/` (`schema-dumper.ts:493`).
That synthesized name **does not match** the `fk_rails_[0-9a-f]{10}` shape, so on
a subsequent `ar db:schema:dump` it would be re-emitted as an explicit `name:`
instead of being suppressed — i.e. it does not round-trip.

Harmless today: `generateModels` reads `fk.name` **only** inside the composite-FK
TODO (`packages/activerecord/src/model-codegen.ts:241` —
`// TODO composite FK ${fk.name}: …`); `belongsTo`/`hasMany` names derive from
`fk.column`/`toTable`, so the fabricated name never leaks into associations.
**Low priority — `deferred` because it's a documented limitation, not a bug.**

## Do as Rails does

Rails auto-names FKs `fk_rails_<10hex>` (a hash of table+column, see
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1755`
`foreign_key_name`, which returns `"fk_rails_#{hashed_identifier}"` at `:1761`)
and omits `name:` from `schema.rb` when the name matches that shape. Trails
already reproduces the hash for real FK creation
(`schema-statements.ts:1247-1250`, `:1903`), but the **schema-ts re-parse**
synthesizes the non-hashed `fk_rails_${table}_${column}` form instead. To
round-trip, the synthesized name must either reproduce Rails' hash shape (so the
dumper's `fkIgnorePattern` suppression matches) or codegen must stop depending on
a synthesized `name` at all.

## Acceptance criteria

- [ ] Either: the synthesized name at `schema-ts-model-parser.ts:130` matches
      Rails' `fk_rails_<10hex>` shape so it round-trips through `SchemaDumper`
      (re-dump suppresses `name:` via `schema-dumper.ts:493`/`:1179-1182`), OR
      codegen at `model-codegen.ts:241` is reworked to not need a synthesized
      `name` (derive purely from `column`/`toTable`).
- [ ] The `model-codegen.ts:241` composite-FK TODO is resolved or its
      intentional codegen-only scope is annotated in code (and the
      `schema-ts-model-parser.test.ts:105-106` expectation updated to match).
- [ ] No change to association names (they already derive from column/toTable).

## Notes

Pure `activerecord-cli` codegen nicety; no runtime AR impact. Bundle into an
adjacent `trails-models-dump` PR if one is in flight.
