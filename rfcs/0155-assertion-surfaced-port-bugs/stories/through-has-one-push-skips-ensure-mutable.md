---
title: "through-has-one-push-skips-ensure-mutable"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8088
claim: "2026-09-25T15:31:38Z"
assignee: "sqlite-pragma-error-parity"
blocked-by: null
closed-reason: null
---

## Context

`has_many_through_associations_test.rb` `test_modifying_has_many_through_has_one_reflection_should_raise` expects `HasManyThroughCantAssociateThroughHasOneOrManyReflection` for `authors(:david).very_special_comments << VerySpecialComment.create!(...)`. trails raises `ActiveRecord::NotNullViolation` for `<<`; `=` and `delete` raise the right error. Rails checks `ensure_mutable` in `activerecord/lib/active_record/associations/has_many_through_association.rb:29-37` (`concat_records`); the trails counterpart is `packages/activerecord/src/associations/has-many-through-association.ts`.

`packages/activerecord/src/associations/has-many-through-associations.test.ts` carries the parked `it.skip` test(s) pointing at this story.

## Acceptance criteria

- `push` on a has-many-through over has_one raises `HasManyThroughCantAssociateThroughHasOneOrManyReflection`.
- The skipped test(s) are un-skipped and pass.
