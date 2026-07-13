---
title: "d2-has-one-touch-polymorphic-inverse-cache"
status: in-progress
updated: 2026-07-13
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4836
claim: "2026-07-13T17:48:28Z"
assignee: "d2-has-one-touch-polymorphic-inverse-cache"
blocked-by: null
closed-reason: null
---

## Context

Split from `d2-has-one-touch-option` (RFC 0005). The touch: cluster in
`packages/activerecord/src/associations/has-one-associations.test.ts` landed 6
of 8 tests; this covers the still-skipped
`polymorphic has one with touch option on create wont cache association so
fetching after transaction commit works` (Rails
`test_polymorphic_has_one_with_touch_option_on_create_wont_cache_association_so_fetching_after_transaction_commit_works`,
vendor/rails/activerecord/test/cases/associations/has_one_associations_test.rb:765).

touch: is honored, but trails emits 7 queries where Rails emits 6. The extra is
a `SELECT chefs WHERE employable_id/type` during creation: the parent
DrinkDesignerWithPolymorphicTouchChef's after_create touch callback loads its
`chef` child through the polymorphic association instead of the cached in-memory
inverse. Rails avoids the SELECT because assigning `chef.employable = designer`
sets the polymorphic inverse, so `designer.chef` returns the (unpersisted)
in-memory chef and touch_record short-circuits on `!persisted?`.

Rails also wires `after_create_commit { association(name).reset_negative_cache }`
in `Builder::HasOne.add_touch_callbacks`
(vendor/rails/activerecord/lib/active_record/associations/builder/has_one.rb:49),
which trails does not yet have.

## Acceptance criteria

- [ ] Polymorphic inverse is set on `belongs_to` assignment so the parent's
      after_create touch finds the cached in-memory child (no extra SELECT).
- [ ] `Builder::HasOne` wires after_create_commit reset_negative_cache.
- [ ] The listed test un-skipped with its verbatim Rails name; query count 6.
