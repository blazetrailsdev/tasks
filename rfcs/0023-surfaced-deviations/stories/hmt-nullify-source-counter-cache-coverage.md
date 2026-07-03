---
title: "Cover source-reflection counter_cache decrement on nullify-through delete"
status: closed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-cover: no reachable Rails fixture. Path 1 of updateThroughCounterCaches (source_reflection counter_cache -> klass.decrement_counter, has_many_through_association.rb:163-166) is a faithful port but structurally unreachable by any Rails fixture. Rails has exactly three has_many :through, dependent: :nullify associations: person.rb jobs_with_dependent_nullify and jobs (source :job, through :references) whose source belongs_to is reference.rb 'belongs_to :job' (no counter_cache), and post.rb tags_with_nullify (source :tag, through :taggings) whose source belongs_to is tagging.rb 'belongs_to :tag' (no counter_cache). No source belongs_to on any nullify-through carries a counter_cache, so Path 1 has no reachable fixture. Adding an invented model/counter_cache would violate the repo's canonical-fidelity rules (models/fixtures must mirror Rails exactly). Path 2 (owner reflection counter_cache) is already covered by the 'update counter caches on delete with dependent nullify' test."
---

## Context

PR #4488 added `updateThroughCounterCaches` to the `:nullify` branch of
`HasManyThroughAssociation#deleteRecords`
(`packages/activerecord/src/associations/has-many-through-association.ts`),
mirroring Rails' `has_many_through_association.rb:163-173`. It has two counter
paths:

1. `source_reflection.options[:counter_cache]` →
   `klass.decrementCounter(counterCacheColumn, ids)` (Rails lines 163-166).
2. `update_counter(-count)` on the owner's own reflection counter cache.

Path 2 is exercised by the un-skipped `update counter caches on delete with
dependent nullify` test (`tags_with_nullify` / `tags_with_nullify_count`).

Path 1 (the source-reflection branch) is **structurally correct but untested**:
no Rails fixture in `has_many_through_associations_test.rb` combines a `nullify`
dependent through-association with a `counter_cache` on the join model's own
`belongs_to`. The only join-model counter_cache in fixtures is
`tagging.rb`'s `belongs_to :taggable, counter_cache: :tags_count`, which is not
on the source (`belongs_to :tag`) reflection and so does not drive this path.

## Acceptance criteria

- [ ] Add (or identify) a canonical model + fixture where a `has_many :through`
      with `dependent: :nullify` has a source `belongs_to` carrying a
      `counter_cache`, and a test asserting the counter is decremented on
      nullify-delete — matching Rails' `klass.decrement_counter` behavior.
- [ ] Verify under SQLite, PG, and MariaDB.
- [ ] If Rails has no such combination anywhere, document that the branch is a
      faithful port with no reachable fixture and close as won't-cover with the
      Rails-source justification.
