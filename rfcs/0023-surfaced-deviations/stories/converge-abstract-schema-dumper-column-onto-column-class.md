---
title: "converge-abstract-schema-dumper-column-onto-column-class"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Type-level only: schema-dumper.ts:27's local Column interface describes the same fields the ported Column class carries; dumped output already matches Rails. No behavioural divergence."
---

## Context

`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts:35`
declares a local `interface Column extends ColumnInfo` (adding `bigint`,
`virtual`, `hasDefault`, `defaultFunction`, `comment`, `sqlType`) as the shape
the dumper helpers read. Rails' `ConnectionAdapters::SchemaDumper` operates on
real `ConnectionAdapters::Column` objects
(`vendor/rails/activerecord/lib/active_record/connection_adapters/column.rb:7`),
which trails ports as a class at
`packages/activerecord/src/connection-adapters/column.ts:11`. The local
interface is a second, weaker description of the same thing — the dumper reads
plain `ColumnInfo` records rather than the ported `Column`.

Found by the RFC 0080 audit of `moved` interface declaration names
(`audit-moved-interface-declaration-names`), which tagged it
`@noRailsEquivalent CONVERGEABLE (story: <this story>)`.

## Acceptance criteria

- The dumper helpers type against the ported `ConnectionAdapters::Column`
  class, with schema reflection handing them `Column` instances as Rails does.
- The local `Column` interface plus its `@noRailsEquivalent` tag are deleted.
- `pnpm parity:api:extra` exits 0 (no stale tag).
