---
title: "through-target-omits-through-built-records-on-new-owner"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8095
claim: "2026-09-25T16:31:39Z"
assignee: "generated-app-typechecks-with-tsc-not-trails-tsc"
blocked-by: null
closed-reason: null
---

## Context

`has_many_through_associations_test.rb` `test_include_method_in_association_through_should_return_true_for_instance_added_with_build` and `..._with_nested_builds`: `person.references.build.build_job` then `assert_includes person.jobs, job` (and `author.posts.build.comments.build` for `author.comments`). trails returns `[]` for `person.jobs.toArray()` on an unsaved owner. Rails merges through-built records via `activerecord/lib/active_record/associations/has_many_through_association.rb` (`build_through_record`, `find_target`) and `collection_association.rb` `load_target`; trails: `packages/activerecord/src/associations/has-many-through-association.ts`.

`packages/activerecord/src/associations/has-many-through-associations.test.ts` carries the parked `it.skip` test(s) pointing at this story.

## Acceptance criteria

- An unsaved owner's through collection includes records built through the join association.
- The skipped test(s) are un-skipped and pass.
