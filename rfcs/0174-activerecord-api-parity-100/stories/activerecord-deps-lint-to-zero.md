---
title: "activerecord: parity:api:deps — activerecord's arel / activemodel / activesupport references match Rails'"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:deps` (RFC 0098 dependency lint) reports, for activerecord:

- → arel: 3 ref mismatches (`internal-metadata.ts#selectEntry` misses `SqlLiteral`;
  `relation/query-methods.ts` `buildNamedBoundSqlLiteral` / `buildBoundSqlLiteral` miss `BindError`) and
  1 Rails arel-using method not implemented.
- → activemodel: 10 ref mismatches (`encrypted-attribute-type.ts#textToDatabaseType` misses `Data`;
  `insert-all.ts#valuesList` and `normalization.ts#serializeCastValue` miss `SerializeCastValue`;
  `type/serialized.ts#encoded` misses `Data`; `attribute-methods/read.ts` / `write.ts` miss `AttrNames`;
  `attributes.ts` `_defaultAttributes` / `defineDefaultAttribute` miss `Attribute`; `enum.ts#_enum` misses
  `Type`; `model-schema.ts#attributesBuilder` misses `Builder`) and 1 method not implemented.
- → activesupport: 7 ✗ where Rails reaches ActiveSupport and the port does not
  (`connection-handler.ts#preventWrites` ×2 — `IsolatedExecutionState`; `connection-pool/queue.ts#waitPoll`
  — `Dependencies`; `migration.ts#migrate` / `#sayWithTime` — `Benchmark`; …).

## Acceptance criteria

- [ ] Each reference goes through the Rails constant (`Arel::Nodes::SqlLiteral`, `ActiveModel::Type::SerializeCastValue`, `ActiveSupport::Benchmark`, …) — no local stand-in.
- [ ] `pnpm parity:api:deps` shows 0 ref mismatches and 0 ✗ for activerecord's three sections.
