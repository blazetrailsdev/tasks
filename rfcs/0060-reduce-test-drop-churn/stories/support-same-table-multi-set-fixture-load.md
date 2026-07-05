---
title: "Lift resolveFixtureNames same-table guard: load multiple same-table fixture sets in one call"
status: ready
updated: 2026-07-05
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`resolveFixtureNames` (packages/activerecord/src/test-helpers/use-fixtures.ts,
the `prior !== undefined` block) still THROWS when two requested sets map to the
same table (e.g. `deadParrots`/`liveParrots` → `parrots`, `dogs`/`otherDogs`),
because historically each `defineFixtures` call deleted its table before
inserting, so the second set's delete wiped the first.

PR #4545 (port-insert-fixtures-set-single-ri-toggle) removed that root cause:
`insertPreparedFixtureSets` now MERGES every prepared set's rows into one
`table_rows_for_connection` hash and issues a single `insertFixturesSet` per
load, deleting each table once and inserting all rows together
(define-fixtures.ts `insertPreparedFixtureSets`, `(merged[table] ??= []).unshift(...rows)`).
Same-table concatenation already works for through/HABTM join tables contributed
by multiple sets. Rails loads multiple same-table fixture _files_ exactly this
way (fixtures.rb:665-693 groups by table then unshifts all rows).

So the guard is now over-conservative and can be lifted for the model-set path
too. The doc comment on `resolveFixtureNames` explicitly names this as the
deferred follow-up ("that combined path needs a defineFixtures change (build
rows per model, delete the shared table once)").

## Acceptance criteria

- Two requested fixture sets backed by the same table load together in one
  `useFixtures`/`fixtures()` call: the table is deleted once and both sets' rows
  are inserted (merged), each accessor returns its own rows.
- Remove/relax the `resolveFixtureNames` same-table throw and its stale doc
  paragraph; keep a guard only for genuinely-conflicting rows (same PK/label).
- A test covers the STI same-table case (e.g. `liveParrots` + `deadParrots` →
  `parrots`) asserting both accessors resolve real rows.
- No test renames; existing single-set behavior preserved on all three lanes.
