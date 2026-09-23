---
title: "Inline or relabel invented relation/model helpers carrying PERMANENT receipts"
status: claimed
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: 6
pr: null
claim: "2026-09-23T18:59:05Z"
assignee: "relabel-invented-model-and-relation-helper-permanent-receipts"
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. These relation/model/adapter-area names
score `novel` (or `moved` only by coincidental short name) without their
receipt, and are trails inventions — CLAUDE.md § No extra abstraction:

- `relation/query-methods.ts:142` `defineValueMethods`, `:636` `setValues`,
  `:837` `structuralUnionEq`, `:2291` `assertValidLeftOuterJoinsBang`,
  `:1586` `toS` (unmeasured)
- `ruby-first.ts:3` `first`, `ruby-drop.ts:5` `drop`, `relation/query-methods.ts:1425`
  `toI`, `ruby-truthy.ts:3` `isRubyTruthy` — ruby-compat-shaped helpers
- `inheritance.ts:108` `moduleParentChain` — a `string[]` prefix builder, not
  `Module#module_parents` (`introspection.rb:53-64`)
- `connection-adapters/postgresql/oid/point.ts:5` `PointValue` — scores `novel`;
  Rails' `ActiveRecord::Point` (`oid/point.rb:4`) is a separate Struct from
  `OID::Point`, so a rename is a convergence proposal to verify
- `relation/predicate-builder.ts:350,353` `Attributes`, `entriesOf` (unmeasured)
- `relation/delegation.ts:271` `refuseImplicitCount` (unmeasured)
- `connection-adapters/abstract/quoting.ts:224` `isSqlLiteral`
- `connection-adapters/abstract/assert-schema-adapter.ts:11`,
  `connection-adapters/abstract/schema-statements.ts` `assertSchemaAdapter`
- `enum.ts:199` `carrier`, `:255` `enumMethod`, `:608` `setEnumWarn`
- `attribute-methods.ts:105` `ownerName`;
  `attribute-methods/serialization.ts:88,94` `HashObject`, `[Symbol.hasInstance]`
- `database-configurations.ts:33` `symbolConnectionName`
- `counter-cache.ts:142` `flushPendingCounterCacheColumns` (prior art
  `pending-counter-cache-columns-registry-has-no-rails-counterpart`, RFC 0112, done)
- `inheritance.ts:123,128,149,161,187,291` `registerModuleTableNamePrefix`,
  `registerModuleTableNameSuffix`, `lookupModuleTableNamePrefix`,
  `lookupModuleTableNameSuffix`, `registerSubclass`, `defineDynamicSelectReaders`
  (and `index.ts` `registerSubclass`) — Rails reads
  `module_parents.detect { respond_to?(:table_name_prefix) }` (`model_schema.rb`)
- `migration.ts:266` `isMigrationClass` (unmeasured)
- `ar-config.ts:3,30` `AsyncExecutor`, `post` — a `Concurrent::ThreadPoolExecutor`
  stand-in that belongs in ruby-compat, not activerecord
- `middleware/database-selector/resolver/session.ts:3` `SessionStore` (+`get`/`set`/`delete`)
- `connection-adapters/sql-type-metadata.ts:50`, `postgresql/type-metadata.ts:45`,
  `mysql/type-metadata.ts:32` `toJSON` — Rails serializes these through
  `encode_with`/`init_with` (prior art `converge-column-encode-with-init-with`, done)

## Acceptance criteria

- Each name is inlined into its Rails-named caller, moved to the package that
  mirrors its Ruby counterpart, or relabelled `CONVERGEABLE <story-id>` against
  an open story.
- Receipts on module-private helpers no gate reads are removed with the helper.
- No name in this list keeps a PERMANENT receipt.
