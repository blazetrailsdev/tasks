---
title: "activerecord-module-super-and-live-include-sites"
status: in-progress
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: trails#9178
claim: "2026-10-21T14:24:34Z"
assignee: "activemodel-activesupport-module-super-inlined-into-includers"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activerecord-drop-ruby-compat-module-class` (RFC 0197). The first PR converted the namespace-only modules (test-helper `Sharded`, `MyApplication::*`, `Admin`, `Cpk`, `Publisher`, `Namespaced`, `Web`) and the modules with no `super` and no post-include definition (`Deduplicable`, `ForeignAssociation`, `ClassSpecificRelation`, abstract and MySQL `ColumnMethods`, `Validations`, `EncryptedFixtures`, `CommandRecorder::StraightReversions`, `Developer::ProjectsAssociationExtension2`).

Still `new Module` / `superMethod` in `packages/activerecord/src`:

**Module `super` (convert per root CLAUDE.md § "A module method's `super` is inlined the same way", the module and its `super` target in one PR):**

- `aggregations.ts`, `associations.ts` (+ `namespaces.ts` `Associations`), `autosave-association.ts`, `callbacks.ts`, `core.ts` (`SuperMethods`), `inheritance.ts`, `persistence.ts`, `scoping.ts` (+ `namespaces.ts` `Scoping`), `timestamp.ts`, `touch-later.ts`, `transactions.ts`, `no-touching.ts`, `locking/optimistic.ts`, `attribute-methods/dirty.ts`, `attribute-methods.ts`
- `associations/through-association.ts`, `test-fixtures.ts`
- `connection-adapters/abstract/query-cache.ts`, `connection-adapters/abstract/database-statements.ts` (target of `postgresql/database-statements.ts:149` `execInsert` and `mysql2/database-statements.ts:51-58` `selectAll`), `connection-adapters/postgresql/schema-definitions.ts` (`primaryKey` super into abstract `ColumnMethods`, `postgresql/schema_definitions.rb`)
- `encryption/encryptable-record.ts`, `encryption/extended-deterministic-queries.ts`, `encryption/extended-deterministic-uniqueness-validator.ts`
- `migration/compatibility.ts` (7 modules, 15 `superMethod`)
- `trailties/controller-runtime.ts`, `trailties/job-runtime.ts`
- `test-helpers/models/post.ts` (`namedExtension` `greeting` super)
- `base.ts:2104` (`find`/`findBy`/`findByBang` extended as a Module) and `base.ts:2340` (`initAttributes`)

**Methods defined after inclusion (live include — owner decision, no carrier):**

- `marshalling.ts` `Methods`: `setFormatVersion` aliases/removes `marshalDump` after `Base` includes it (`marshalling.rb:6-16`).
- `store.ts` `_storeAccessorsModule`: per-class module, accessors defined after include (`store.rb:211-217` `_store_accessors_module`).
- `attribute-methods.ts` `generatedAttributeMethods` / `core.ts` `generatedAssociationMethods` / `relation/delegation.ts` `GeneratedRelationMethods`: generated-method modules (`attribute_methods.rb:42-50`, `core.rb:442`, `relation/delegation.rb:57`).
- `relation/query-methods.ts:1011` and `associations/builder/collection-association.ts:40`: `Module.new(&block)` from a user block (`query_methods.rb:` `extending!`, `builder/collection_association.rb:24-30`).

**Untagged inlinings from the first slice (trails#9099):** the four `deduplicated` overrides inline `Deduplicable#deduplicated` (`connection_adapters/deduplicable.rb:24-26`) with no `@inlinedFrom` tag, because `scripts/api-compare/extract-ruby-api.rb:261` `INLINED_HOOKS` records spans only for `initialize`/`new`:

- `connection-adapters/column.ts` (`column.rb:104-112`)
- `connection-adapters/sql-type-metadata.ts` (`sql_type_metadata.rb:39-42`)
- `connection-adapters/mysql/type-metadata.ts` (`mysql/type_metadata.rb:32-36`)
- `connection-adapters/postgresql/type-metadata.ts` (`postgresql/type_metadata.rb:36-39`)

## Acceptance criteria

- The four `deduplicated` overrides carry `@inlinedFrom ActiveRecord::ConnectionAdapters::Deduplicable#deduplicated rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:24-26`, with the extractor extended so `pnpm parity:api:inlined` checks them.

- Every module in the first list is a plain-object module, its `super` inlined per RFC 0197 with `@inlinedFrom` tags where the target lives in another `.rb`.
- The live-include sites are settled by the repo owner's ruling, not by a new carrier.
- No `new Module` / `instanceof Module` / `Module` type import from ruby-compat remains in `packages/activerecord/src`.
