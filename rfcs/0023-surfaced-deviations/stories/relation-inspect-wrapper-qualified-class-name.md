---
title: "Relation#inspect wrapper uses unqualified class name vs Rails' ActiveRecord::-namespaced name"
status: done
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - calculations-test-canonical
  - relations-test-canonical
deps-rfc: []
est-loc: 40
priority: null
pr: 4865
claim: "2026-07-14T15:08:33Z"
assignee: "relation-inspect-wrapper-qualified-class-name"
blocked-by: null
---

## Context

`Relation#inspect` (relation.ts ~L1387) renders the wrapper class name via
`this.constructor.name`, yielding the **unqualified** name — `#<Relation [...]>`,
`#<CollectionProxy [...]>`, `#<AssociationRelation [...]>`.

Rails renders `self.class.name`, the **namespace-qualified** class name
(relation.rb:1295 `"#<#{self.class.name} [...]>"`):

- `ActiveRecord::Relation` — pinned literal in relations_test.rb:2109-2110
  (`Post.limit(2).inspect` → `#<ActiveRecord::Relation [...]>`).
- `ActiveRecord::Associations::CollectionProxy`
- `ActiveRecord::AssociationRelation`

This deviation predates and was surfaced by PR #3885 (story
`relation-inspect-unloaded-converge-to-rails`); it affects BOTH the loaded and
unloaded branches and was explicitly left out of that story's scope (which
converged the unloaded record-vs-chain shape, not the class-name prefix).

The current trails tests pin the unqualified output (`#<Relation [...]>`,
relations.test.ts / calculations.test.ts inspect cases) — converging the prefix
means updating those assertions to the Rails-qualified strings.

## Acceptance criteria

- `inspect` emits the Rails-qualified wrapper name for each relation class:
  `ActiveRecord::Relation`, `ActiveRecord::Associations::CollectionProxy`,
  `ActiveRecord::AssociationRelation` — for both loaded and unloaded branches.
- Decide the source of the qualified name (a static per-class field/map vs a
  derived lookup) rather than `constructor.name`; keep the three-class
  distinction intact.
- Update the pinned inspect assertions in relations.test.ts /
  calculations.test.ts to the qualified strings; test names unchanged.
- api:compare / test:compare deltas non-negative.

## Notes

- Rails: relation.rb:1295; relations_test.rb:2108-2111.
- trails: relation.ts `inspect()` (~L1387) `this.constructor.name`.
