---
title: "d2-has-one-touch-nonpersisted-build-load"
status: claimed
updated: 2026-07-13
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-13T17:38:23Z"
assignee: "d2-has-one-touch-nonpersisted-build-load"
blocked-by: null
closed-reason: null
---

## Context

Split from `d2-has-one-touch-option` (RFC 0005). Covers the still-skipped
`has one with touch option on nonpersisted built associations doesnt update parent`
(Rails `test_has_one_with_touch_option_on_nonpersisted_built_associations_doesnt_update_parent`,
vendor/rails/activerecord/test/cases/associations/has_one_associations_test.rb:939,
with inline SpecialCar/SpecialBulb models at :929).

touch: correctly does NOT fire for an unpersisted built child (parent untouched
— the behavioral point of the test). The gap is purely the query count: Rails'
synchronous `has_one` build runs one `load_target` SELECT inside `replace`
(has_one_association.rb:59), so `car.build_special_bulb; car.build_special_bulb`
emits 1 query. trails' `SingularAssociation#build` is necessarily synchronous (a
JS build/property path cannot await DB I/O), so it emits 0 queries.

Resolving this needs the build/replace path to materialize the current target
(the sync-build async limitation shared with the has_one writer split, cf.
commit 7bb31b8 "immediate-persist writer loads existing target before replace").

## Acceptance criteria

- [ ] has_one `build` loads the existing target once before replacing, matching
      Rails' synchronous replace/load_target.
- [ ] The listed test un-skipped with its verbatim Rails name; query count 1;
      parent updated_at unchanged.
