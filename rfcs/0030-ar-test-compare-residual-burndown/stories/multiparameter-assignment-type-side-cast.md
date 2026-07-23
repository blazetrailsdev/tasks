---
title: "multiparameter-assignment-type-side-cast"
status: done
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5146
claim: "2026-07-23T13:58:44Z"
assignee: "multiparameter-assignment-type-side-cast"
blocked-by: null
closed-reason: null
---

## Context

Rails' multiparameter assignment writes the raw numeric-keyed hash to the
attribute and lets the type assemble it at cast time
(`vendor/rails/activemodel/lib/active_model/type/helpers/accepts_multiparameter_time.rb`;
`Attribute::FromUser#came_from_user?` at
`vendor/rails/activemodel/lib/active_model/attribute.rb:202` returns false via
`type.value_constructed_by_mass_assignment?(value_before_type_cast)`).

Trails instead assembles the Temporal value in AR-land
(`packages/activerecord/src/multiparameter-attribute-assignment.ts`
`assignDateTimeAttribute` → `assembleValue` → `writeAttribute(name, assembled)`),
so the attribute's `valueBeforeTypeCast` is the assembled Instant, never the
hash, and `cameFromUser("written_on")` returns true where Rails returns false.
The test `multiparameter assigned attributes did not come from user`
(`packages/activerecord/src/multiparameter-attributes.test.ts`) currently
asserts the divergent `true` with a call-site DEVIATION comment referencing
this story.

Note: the activemodel wrapper's mass-assignment hook was renamed to
`isValueConstructedByMassAssignment`
(`packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts`) so it
actually overrides `Type.isValueConstructedByMassAssignment`
(`packages/activemodel/src/type/value.ts:86`) — previously it was a dead method
under the wrong name. The remaining gap is purely the AR-side assembly.

## Acceptance criteria

- `assignDateTimeAttribute` writes the numeric-keyed parts hash and lets the
  type's AcceptsMultiparameterTime cast assemble the value (Rails
  `execute_callstack_for_multiparameter_attributes` shape), or an equivalent
  convergence that makes `valueBeforeTypeCast` the hash.
- `cameFromUser("written_on")` returns false after multiparameter assignment;
  the deviation assertion + comment in multiparameter-attributes.test.ts is
  flipped to Rails' expected value.
- Existing multiparameter tests (error collection, blank handling, aware
  attributes) still pass.
