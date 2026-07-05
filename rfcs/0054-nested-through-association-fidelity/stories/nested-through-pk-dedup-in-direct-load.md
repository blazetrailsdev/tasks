---
title: "nested-through direct-load deduplicates by PK; Rails returns full multiset"
status: done
updated: 2026-07-05
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4611
claim: "2026-07-05T13:52:25Z"
assignee: "nested-through-pk-dedup-in-direct-load"
blocked-by: null
---

## Context

Surfaced during RFC 0019 canonical-schema burndown of
`packages/activerecord/src/associations/nested-through-associations.test.ts`.

Rails' `nested_through_associations_test.rb` has three tests that expect
duplicate rows in a nested-through result set when the same target record is
reachable via multiple intermediate paths:

- `test_has_many_through_has_many_through_with_has_many_source_reflection`
  (`david.subscribers` = [alterself, webster132, webster132])
- `test_has_many_through_has_many_through_with_belongs_to_source_reflection`
  (`david.tagging_tags` = [general, general])
- and the distinct-subscriber count check in
  `test_distinct_has_many_through_a_has_many_through_association_on_through_reflection`

trails currently deduplicates nested-through results by PK, so the direct-load
path returns the unique set instead of the full multiset Rails returns.
The preload path is unaffected (preload hydrates each target once per owner).

Files: `packages/activerecord/src/associations/nested-through-associations.test.ts` (lines 155-170, 422-436)
Rails source: `activerecord/test/cases/associations/nested_through_associations_test.rb` lines 98-117, 312-341

## Acceptance criteria

- `david.subscribers.toArray()` returns [alterself, webster132, webster132] (3 rows, with duplicate)
- `david.taggingTags.toArray()` returns [general, general] (2 rows, same tag twice)
- The two `it.todo` tests in nested-through-associations.test.ts (lines 156, 422) un-skip and pass on all three adapters
