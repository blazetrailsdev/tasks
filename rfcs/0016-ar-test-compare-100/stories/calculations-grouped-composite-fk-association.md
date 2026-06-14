---
title: "Grouped calculation by composite-key belongs_to association"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of `f9i-calculations-grouped-assoc` (PR #3241), which added grouped
calculations by a single-column belongs_to association.

Rails `execute_grouped_calculation` (calculations.rb:521) does
`group_fields = Array(association.foreign_key)` and builds a multi-column
GROUP BY for a composite-key belongs_to, keyed by the loaded record. The
trails `groupedAggregate` helper groups by a single column only (it reads
`_groupColumns[0]`), so PR #3241's `resolveGroupAssociation`
(relation/calculations.ts) deliberately returns `null` for an array
`foreignKey` — a composite-FK association falls through rather than silently
grouping by a truncated key. This mirrors the CPK grouped-calculation deferral
already present in `performCount`.

## Acceptance criteria

- `groupedAggregate` supports a multi-column GROUP BY for a composite-key
  belongs_to association (mirroring Rails `Array(association.foreign_key)`),
  with the result keyed by the loaded associated record.
- Remove the `Array.isArray(reflection.foreignKey)` guard in
  `resolveGroupAssociation` once composite grouping is supported.
- Record lookup resolves through the composite primary key
  (`klass.base_class.where(pk => key_tuples)`).
- Covered by a Rails-faithful test using a composite-FK belongs_to fixture.
