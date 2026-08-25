---
title: "mark-column-method-names-internal"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5953
claim: "2026-08-03T02:45:48Z"
assignee: "mark-column-method-names-internal"
blocked-by: null
closed-reason: null
---

## Context

Found by the `@noRailsEquivalent` tag audit (RFC 0080). `columnMethodNames` is
tagged as public no-Rails-equivalent surface in three places:

- `connection-adapters/abstract-adapter.ts:1396`
- `connection-adapters/abstract-mysql-adapter.ts:586`
- `connection-adapters/postgresql-adapter.ts:2563`

Rails spells this as metaprogramming, not as public API:
`define_column_methods` at `connection_adapters/abstract/schema_definitions.rb:324`,
plus the per-adapter `ColumnMethods` modules that call it. There is no public
Ruby method with this name anywhere.

TypeScript genuinely does need the reified list — there is no `define_method`
— so the member itself stays. What is wrong is that it is public: tagging it
blesses invented public API. Marking it `@internal` removes it from the
compared surface honestly, the same disposition the audit gives to other
reification helpers.

## Acceptance criteria

- Each of the three `columnMethodNames` declarations is marked `@internal`
  (or `_`-prefixed, whichever matches the surrounding file) and its
  `@noRailsEquivalent` tag is deleted.
- The override chain still works: each adapter appends to the abstract
  implementation exactly where Rails' adapter-specific `ColumnMethods` module
  extends the abstract one.
- No external package imports the member as public API after the change.
- `pnpm parity:api:extra --package activerecord` reports no stale tags.
