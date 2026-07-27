---
title: "Deviation: nested-attributes sync setter cannot raise RecordNotSaved at assignment"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Deviation record, so the evidence is not re-derived. Rails' nested-attributes
one-to-one writer removes the displaced record inline and raises `RecordNotSaved`
at the assignment expression
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:57-115`).
trails cannot: `#{name}Attributes=` is a real JS accessor
(`Object.defineProperty(modelClass.prototype, attrName, { set })` in
`generateAssociationWriter`, `packages/activerecord/src/nested-attributes.ts`), and
a JS setter cannot await or throw on an async write.

PR #5441 narrowed this (inline write preserved; failure sticky and never
discarded; awaitable `set#{Name}Attributes` raises at the assignment point). The
residual deviation is that the bare `owner.#{name}Attributes = {...}` statement
still cannot raise. **Both obvious closures were measured and are shut:**

1. _Defer the DB write to `save()`_ — reopens the two-FK-matching-rows window
   that RFC 0068 exists to close (its "Why the deferral is the root cause"
   section; PRs #4899/#4901/#4908/#4910 closed unmerged), and rebuilds
   `_displacedRecords` / `_removeDisplacedFromDb` / `removeDisplaced`, which are
   already fully deleted from the tree. It also diverges from Rails on the
   _success_ path: `remove_target!` calls `target.save`, so Rails nullifies the
   FK in the DB before the assignment expression returns.
2. _Throw loudly from the sync setter_ (the RFC 0068 `owner.account = x` pattern)
   — measured: breaks 3 mirrored Rails tests
   (`TestNestedAttributesOnAHasOneAssociation > should replace an existing record
if there is no id`, `TestDefaultAutosaveAssociationOnAHasOneAssociation >
callbacks firing order on save` / `on update`). Rails'
   `nested_attributes_test.rb:288` assigns on a persisted owner with a persisted
   ship and expects success, because Rails' nullify save succeeds there.

A second structural wall: nested-attribute keys are re-dispatched by
`_reapplyNestedAttrSetters` from **`Base`'s constructor**
(`packages/activerecord/src/base.ts:3366`), and JS constructors cannot be async
either — so `new Model({shipAttributes: ...})` / `Model.create({...})` have no
awaitable step to hang the raise on.

Note that no _mirrored_ Rails test pins assignment-time DB detachment (Rails'
own test asserts only in-memory state), so option 1 would leave the suite green
while silently regressing fidelity. That is why this is a written record.

## Acceptance criteria

- [ ] Confirm the deviation is documented at the call site (it currently is, on
      `detachDisplacedAtAssignment`) and that the two closed options above are
      captured there or here so they are not re-litigated.
- [ ] No behaviour change unless a _new_ mechanism (not option 1 or 2) is found.
