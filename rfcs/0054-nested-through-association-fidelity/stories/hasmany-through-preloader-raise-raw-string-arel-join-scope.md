---
title: "has_many-through preloader: raise ConfigurationError for raw string/Arel join reflection scope, matching Rails"
status: done
updated: 2026-07-07
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 45
priority: 22
pr: 4741
claim: "2026-07-07T15:13:51Z"
assignee: "hasmany-through-preloader-raise-raw-string-arel-join-scope"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4526 (story
`hasone-through-preloader-carry-raw-string-arel-joins`), which made the
**has_one**-through preloader raise `ConfigurationError` for a reflection scope
carrying a raw SQL string / Arel-node join (`.joins("INNER JOIN …")`), matching
Rails' `through_scope` (`through_association.rb:117-134`): it nests the scope's
full `joins_values` under the source reflection via
`joins!(source_reflection.name => joins)`, and `JoinDependency.walk_tree`
(`join_dependency.rb:53-63,224-226`) symbolizes a raw string into a bogus
association name → `find_reflection` raises `ActiveRecord::ConfigurationError`.

Rails' `through_scope` branch is NOT gated on collection, so **has_many**-through
raises the same error. Verified against a live Rails console with the vendored
ActiveRecord:

```ruby
has_many :raw_clubs, -> { joins("INNER JOIN categories …").where("…") },
         through: :membership, source: :club
Member.preload(:raw_clubs).to_a
# => ActiveRecord::ConfigurationError: Can't join 'Club' to association named
#    'INNER JOIN categories …'; perhaps you misspelled it?
```

Trails diverges: `_buildThroughScope`'s collection (has_many) branch
(`packages/activerecord/src/associations/preloader/through-association.ts`,
`isCollection` arm, ~line 397-408) only copies through-table predicates onto the
through query and never nests the source join — so a raw-join reflection scope on
a has_many-through is silently deferred to the source-preloader stage (where the
raw join is valid SQL against the source base table) and returns rows instead of
raising. This is failure-safe but is a lenient deviation from Rails.

## Acceptance criteria

- [ ] `_buildThroughScope`'s has_many (collection) branch nests the reflection
      scope's raw `_joinValues` under the source reflection name when the
      reflection where-clause is non-empty (mirror the has_one branch added in
      #4526: `scope.joins({ [sourceName]: [...rawJoinValues] })`), so the through
      query build raises the same `ConfigurationError` Rails raises.
- [ ] A canonical-model has_many-through scope + test asserting the raise on
      preload (mirror `through-association-raw-join-scope.test.ts`, e.g. Member →
      memberships → clubs `has_many` with a raw-join scope).
- [ ] No regression in has_many_through / nested-through / preloader / eager
      suites (symbol-association joins, e.g. the `general` scope's
      `left_joins(:category)`, must still be carried without error).

## Notes

Relevant code: `packages/activerecord/src/associations/preloader/through-association.ts`
(`_buildThroughScope` collection branch). Rails: `preloader/through_association.rb:117-134`;
`join_dependency.rb:224-226`. Same `_joinValues` bucket + `whereNonEmpty` proxy
the has_one branch already uses.
