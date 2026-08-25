---
title: "converge Association#checkKlass to constructor (check_validity! timing deviation)"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3613
claim: "2026-06-19T01:02:17Z"
assignee: "assoc-check-validity-raises-at-load-not-constructor"
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/associations_test.rb:779-798` asserts that
`ModelAssociatedToClassesThatDoNotExist.new.non_existent_has_one_class` raises `NameError`
synchronously. In Rails this fires in `Association#initialize → check_validity! → klass →
compute_class` — the moment the Association object is constructed (i.e. when
`record.association(:name)` is first called on a new record).

In trails (`packages/activerecord/src/associations/association.ts`), the equivalent class
resolution was placed in `Association#checkKlass()`, called at the top of `loadTarget()`
rather than in the constructor. This is because
`packages/activerecord/src/associations/belongs-to-inverse-seed-composite-pk.test.ts:8-10`
deliberately relies on the inverse-seeding path (`setTarget()`) working without the target
class being in the registry ("the target need not be registered, since we hold the instance").
Moving the check to the constructor broke that test.

The test for this deviation uses `await record.association("nonExistentHasOneClass").loadTarget()`
(async reject) instead of synchronous throw, and `new` record with no persistence/FK.

## Acceptance criteria

- `ModelAssociatedToClassesThatDoNotExist.new.non_existent_has_one_class` raises synchronously
  (or: `record.association("name")` throws rather than returning an Association instance).
- `belongs-to-inverse-seed-composite-pk.test.ts` continues to pass — either by registering
  `CompositePkParent` there, or by restricting the constructor check to cases where a DB
  query is actually attempted (not mere `setTarget` / metadata reads).
- All three NameError assertions in `OverridingAssociationsTest` use synchronous `.toThrow()`
  matching Rails' `assert_raises NameError` shape.
