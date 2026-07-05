---
title: "hasMany-through-habtm direct-load returns empty; preload/joins work"
status: done
updated: 2026-07-05
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4610
claim: "2026-07-05T13:37:26Z"
assignee: "nested-through-habtm-direct-load-empty"
blocked-by: null
---

## Context

Surfaced during RFC 0019 canonical-schema burndown of
`packages/activerecord/src/associations/nested-through-associations.test.ts`.

Three Rails tests require `hasMany :through` whose through association is a
`has_and_belongs_to_many` (habtm) to work on the direct-load path:

- `test_has_many_through_has_many_with_has_and_belongs_to_many_source_reflection`
  (`categories(:technology).postComments` = [greetings, more_greetings])
- `test_has_many_through_has_many_with_has_many_through_habtm_source_reflection`
  (`authors(:bob).categoryPostComments` = [greetings, more_greetings])
- `test_has_many_through_reset_source_reflection_after_loading_is_complete`
  (`Category.find(2).orderedPostComments`)

On the direct-load path (`relation.toArray()` / proxy access), trails returns
an empty array for all three. The preload path (`includes`) and the joins path
both work correctly. The habtm join step is not being inserted into the
direct-load chain builder.

Files: `packages/activerecord/src/associations/nested-through-associations.test.ts` (lines 358, 390, 820)
Rails source: `activerecord/test/cases/associations/nested_through_associations_test.rb` lines 255-307, 655-659

## Acceptance criteria

- `category.postComments.toArray()` returns comments via habtm join
- `author.categoryPostComments.toArray()` returns comments via habtm chain
- `Category.find(2).orderedPostComments.toArray()` matches the preload result
- The three `it.todo` tests in nested-through-associations.test.ts (lines 358, 390, 820) un-skip and pass on all three adapters
