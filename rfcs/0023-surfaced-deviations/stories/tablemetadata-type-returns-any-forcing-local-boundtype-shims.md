---
title: "TableMetadata#type returns any, forcing local BoundType duck-type shims"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5193. `TableMetadata#type`
(`packages/activerecord/src/table-metadata.ts:31`) is declared
`type(columnName: string): any`. Because it answers `any`, every consumer that
wants a checked shape has to declare its own local duck-type — e.g. the
`BoundType` interface at
`packages/activerecord/src/relation/predicate-builder.ts:20-24`, which exists
only to give `cast` / `serialize` / `isForceEquality?` types the real Type
already has.

Rails' `TableMetadata#type` (`table_metadata.rb:17-19`) is
`arel_table.type_for_attribute(column_name)` and always yields a real
`ActiveModel::Type::Value` — casters resolve unknown columns to
`Type.default_value`, never nil (`type_caster/connection.rb:26`). So the `any`
is a trails typing gap, not a modelling of Rails nullability, and the local
`BoundType` shim is an invention that can be deleted once the return type names
the actual Type interface.

Check other `any`-driven local shims around `table.type(...)` before landing —
this may converge more than one duck-type.

## Acceptance criteria

- [ ] `TableMetadata#type` declares the real Type return type instead of `any`.
- [ ] The `BoundType` interface in predicate-builder.ts is deleted and its uses
      reference the shared type.
- [ ] `pnpm exec tsc --build` clean; predicate-builder tests pass unchanged.
