---
title: "Relation mutation paths read model.arel_table where Rails reads the table accessor"
status: draft
updated: 2026-07-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0072 model-accessor sweep (PR #5322). These reads look like
model-accessor gaps but are the opposite: Rails does **not** read `model` there,
it reads the `table` attr_reader (`vendor/rails/activerecord/lib/active_record/relation.rb:71`).

Rails sites:

- relation.rb:597 (`update_all`) — `attr = table[model.locking_column]`
- relation.rb:931 (`update_counters`) — `attr = table[counter_name]`
- relation.rb:1383 (`_substitute_values`) — `attr = table[name]`
- relation.rb:1023-1024 (`delete_all`) — `arel.source.left = table`

trails `packages/activerecord/src/relation.ts` writes
`this._modelClass.arelTable` at each of these, which skips the relation's own
`table` accessor (`relation.ts`: `return this._table ?? this._modelClass.arelTable`).
The values coincide today only because `_table` is almost always unset; a
relation constructed with an explicit `table:` (Rails' `Relation.new(model, table:)`,
relation.rb:77-83) would diverge — the mutation would target the model's table
rather than the relation's.

PR #5322 deliberately left these alone: routing them through `this.model` would
have looked like convergence while moving _away_ from Rails. The correct fix is
`this.table`.

## Acceptance criteria

- The arel-table reads in `updateAll`, `deleteAll`, `updateCounters`, and
  `_substituteValues` use the relation's `table` accessor, matching
  relation.rb:597, 931, 1023-1024, 1383.
- A test constructs a relation with an explicit non-default table and asserts
  the mutation targets it (check `vendor/rails/activerecord/test/cases/` for an
  existing case first; only add a `*.trails.test.ts` extra if Rails has none).
- Confirm no wide-baseline entry regresses (`pnpm api:calls:wide`).
