---
title: "activerecord: MySQL/PostgreSQL TypeMetadata#deduplicated overrides"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps:
  - activerecord-inheritance-residue-delegate-class-supers
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MySQL::TypeMetadata#deduplicated` and `PostgreSQL::TypeMetadata#deduplicated` are private overrides
Rails defines on each delegator:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/type_metadata.rb:32-36` —
  `__setobj__(__getobj__.deduplicate); @extra = -extra if extra; super`
- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/type_metadata.rb:36-39` —
  `__setobj__(__getobj__.deduplicate); super`

trails' `packages/activerecord/src/connection-adapters/mysql/type-metadata.ts` and
`postgresql/type-metadata.ts` define neither: both classes `extends SqlTypeMetadata` where Rails'
are `DelegateClass(SqlTypeMetadata)`, so there is no wrapped object to `__setobj__`, and they
inherit `SqlTypeMetadata#deduplicated`. Since trails#8368 the adapters build both through
`Deduplicable::ClassMethods#new` (`deduplicable.rb:13-15`), so the missing overrides are on a live
path. Neither file includes `Deduplicable` itself either, where Rails does (`mysql/type_metadata.rb:9`,
`postgresql/type_metadata.rb:10`).

## Acceptance criteria

- [ ] Once the two classes are ruby-compat `DelegateClass(SqlTypeMetadata)` subclasses (`activerecord-inheritance-residue-delegate-class-supers`), each `include()`s `Deduplicable` and defines `deduplicated` with Rails' body, ending in the module's `deduplicated` as Rails' ends in `super`.
- [ ] The wrapped `SqlTypeMetadata` of a deduplicated `TypeMetadata` is the registered instance.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no new baseline row.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
