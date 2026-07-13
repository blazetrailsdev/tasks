---
title: "has_one touch: option cluster"
status: done
updated: 2026-07-13
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4833
claim: "2026-07-13T17:18:22Z"
assignee: "d2-has-one-touch-option"
blocked-by: null
closed-reason: null
---

## Context

Split from `d2-has-one-remaining-gaps`. The has_one touch-option cluster in
`packages/activerecord/src/associations/has-one-associations.test.ts`
(~9 `it.skip` entries: `has one with touch option on
create/update/touch/destroy/empty update/nonpersisted built` plus the
polymorphic `polymorphic has one with touch option on create/update` variants).

Rails: `has_one_associations_test.rb` tests `test_has_one_with_touch_option_on_*`.
Needs `touch:` support wired through has_one autosave/belongs_to touch
propagation, plus the `Club`/`Membership` and `SpecialCar`/`SpecialBulb`
models (vendor/rails/activerecord/test/models/club.rb, membership.rb, car.rb,
bulb.rb) ported with their `touch:` associations.

## Acceptance criteria

- [ ] touch: option honored on has_one; parent `updated_at` bumped on child
      create/update/touch/destroy per Rails.
- [ ] Club/Membership + SpecialCar/SpecialBulb models available in test-helpers.
- [ ] Listed touch tests un-skipped with verbatim Rails names; test:compare
      delta non-negative.
