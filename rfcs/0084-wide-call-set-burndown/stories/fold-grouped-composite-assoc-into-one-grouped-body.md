---
title: "Fold groupedCompositeAssoc back into the single execute_grouped_calculation body"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6477
claim: "2026-08-13T16:45:43Z"
assignee: "fold-grouped-composite-assoc-into-one-grouped-body"
blocked-by: null
closed-reason: null
---

## Context

Rails has ONE `execute_grouped_calculation`
(activerecord/lib/active_record/relation/calculations.rb:514-595). It handles a
composite-key belongs_to inside that single body: `group_fields =
Array(association.foreign_key)` at :521 expands the FK to however many columns
it has, and the key-record lookup at :562-564
(`association.klass.base_class.where(primary_key => key_ids)`) keys the result
by the loaded record either way. There is no arity branch.

trails splits it into two functions in
`packages/activerecord/src/relation/calculations.ts`: `groupedAggregate`, and
`groupedCompositeAssoc`, which `groupedAggregate` delegates to when
`association.foreignKey` is an array. The split is flagged in the file with a
`DIVERGENCE (Rails calculations.rb:513-595)` note.

The two bodies have now drifted into near-duplicates and have to be kept in
lockstep by hand — PR #6460 had to make the SAME `ColumnAliasTracker` change
twice, in both arms, and #6448 before it had to converge both onto
`relation.arel` twice. Each future change to the grouped body is two edits and
two chances to diverge.

## Converged shape

Fold `groupedCompositeAssoc` back into `groupedAggregate` so there is one
`executeGroupedCalculation` body, as Rails has: expand the belongs_to foreign
key to `Array(association.foreign_key)` in the one place (:521) and let the
existing group-column loop carry any arity, with the key-record lookup handling
a scalar and a tuple key through the same `where(primary_key => key_ids)` call.
Delete the DIVERGENCE note with the code it describes.

Watch out for: the composite arm's NUL-joined tuple key map, and the
`_readAttribute` per-column read it uses because the composite-PK `id` accessor
returns an array — both need to survive the fold.

## Acceptance criteria

- [ ] `groupedCompositeAssoc` is gone; one grouped body remains.
- [ ] `calculations.test.ts`, `calculations.trails.test.ts`,
      `relation/grouped-composite-assoc-*.trails.test.ts` and
      `relation/cpk-eager-count-aggregate-build-joins-fold.trails.test.ts` stay
      green.
- [ ] `pnpm parity:api:calls` non-negative.
