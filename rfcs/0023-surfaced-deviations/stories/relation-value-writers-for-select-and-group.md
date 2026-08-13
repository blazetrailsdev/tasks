---
title: "Port Relation's select_values / group_values writers so calculations stop assigning the backing fields"
status: draft
updated: 2026-08-13
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails assigns relation values through the generated writers —
`relation.select_values = [...]` and `relation.group_values = group_fields`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:484`,
`:552-553`), part of `Relation::VALUE_METHODS`
(`activerecord/lib/active_record/relation.rb`).

trails' `Relation` exposes `selectValues` and `groupValues` as READERS only, so
the calculation arms assign the backing stores directly —
`relation._selectColumns = [...]`, `relation._groupColumns = [...]` in
`packages/activerecord/src/relation/calculations.ts` (both grouped arms,
`executeSimpleCalculation`, `buildCountSubquery`). Reaching past the public
reader into the private field is the deviation; it also forces
`groupNodes as unknown as string[]` casts because `_groupColumns` is typed
`string[]` while Rails stores the `arel_columns`-resolved nodes.

## Converged shape

Give `Relation` the Rails value writers (`set`-prefixed only if a TS `set`
accessor cannot express it) for at least `selectValues` and `groupValues`,
typed to hold Arel nodes as Rails does, and have the calculation arms assign
through them.

## Acceptance criteria

- [ ] `Relation` exposes writers for `selectValues` / `groupValues` matching the
      Rails value-method names.
- [ ] No calculation arm assigns `_selectColumns` / `_groupColumns` directly,
      and the `as unknown as string[]` casts are gone.
- [ ] `calculations.test.ts`, `calculations.trails.test.ts` and
      `relations.test.ts` stay green (including `group with subquery in from
does not use original table name`, which depends on the resolved nodes
      being stored).
