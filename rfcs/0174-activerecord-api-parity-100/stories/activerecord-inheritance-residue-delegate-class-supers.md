---
title: "activerecord: inheritance 209/217 — DelegateClass supers and the OID::DateTime parent spelling"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: ["api-compare-nulls-a-delegateclass-superclass"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports activerecord **inheritance 209/217** (`scripts/api-compare/inheritance-exclude.json`
is empty, so all 8 are live):

- Five `< DelegateClass(X)` classes the Rails extractor records with a `nil` superclass:
  `AttributeMethods::TimeZoneConversion::TimeZoneConverter`, `Core::InspectionMask`,
  `Locking::LockingType`, `Normalization::NormalizedValueType`, `Type::Serialized`. The extractor fix
  is `api-compare-nulls-a-delegateclass-superclass` (RFC 0120).
- `MySQL::TypeMetadata` and `PostgreSQL::TypeMetadata` — Rails:
  `class TypeMetadata < DelegateClass(SqlTypeMetadata)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/type_metadata.rb`,
  `postgresql/type_metadata.rb`); trails `extends SqlTypeMetadata`. Once the extractor resolves the
  parent, the port must also _be_ a delegator (ruby-compat `DelegateClass`, `packages/ruby-compat/src/delegate.ts`).
- `PostgreSQL::OID::DateTime` — Rails `< Type::DateTime`, trails imports it as `ArDateTime`
  (`packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts`), so the TS parent name
  does not match.

## Acceptance criteria

- [ ] After `api-compare-nulls-a-delegateclass-superclass`, the two `TypeMetadata` classes are ruby-compat `DelegateClass(SqlTypeMetadata)` subclasses carrying only their own members.
- [ ] `OID::DateTime`'s parent is referenced as `Type.DateTime` (or the import renamed) so the chain reads as Rails'.
- [ ] `pnpm parity:api` activerecord inheritance **217/217**.
