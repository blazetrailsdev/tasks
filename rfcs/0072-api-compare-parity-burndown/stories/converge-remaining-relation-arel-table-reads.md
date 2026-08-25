---
title: "Check the four remaining relation.ts arelTable reads against their Rails bodies"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5933
claim: "2026-08-02T23:25:46Z"
assignee: "converge-remaining-relation-arel-table-reads"
blocked-by: null
closed-reason: null
---

## Context

Remainder from #5903 (`converge-relation-table-attr-reader-reads`), which
routed the reads with a clear Rails `table` attr_reader counterpart through
`Relation#table` and explicitly left these four alone rather than guessing.

Still reading `this._modelClass.arelTable` in
`packages/activerecord/src/relation.ts`:

- `_pluckInner`
- `_buildEagerJoinManager`
- `_buildEagerIdSubquery`
- `_distinctSelectForLimitedIds`

These are trails-shaped helpers with no 1:1 Rails body. The nearest Rails
counterparts (`Calculations#pluck`, `apply_join_dependency` and the limited-id
subquery path in `relation.rb` / `finder_methods.rb`) do read `table`, so each
is likely a wrong-table divergence for an aliased relation — but that must be
established by reading the Rails body rather than assumed.

## Acceptance criteria

- Each of the four is checked against its nearest Rails body; those whose Rails
  counterpart reads the `table` attr_reader are routed through `this.table`.
- Ones with no counterpart, or that genuinely want the model's own
  `arel_table`, stay put and are justified at the call site.
- Regression coverage for any behavior change, failing on baseline, using
  `new Relation(Model, Model.arelTable.alias(...))` and adapter-agnostic SQL
  assertions (`support/quote-regex.js`).
