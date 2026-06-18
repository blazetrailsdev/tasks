---
title: "Direct-loader/build/through polymorphic _type sites should use polymorphic_name (base_class)"
status: ready
updated: 2026-06-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While porting the mutating-polymorphic join_model tests (PR #3586, RFC 0019
wave 2) the write-side polymorphic `_type` sites were converged to Rails'
`polymorphic_name` (`base_class.name`) — collection-proxy build/push/through,
`CollectionAssociation`/`HasOneAssociation#setOwnerAttributes`,
`BelongsToPolymorphicAssociation#polymorphicTypeName`, and `setHasOne`.

But several **direct-loader / build / through** sites in `associations.ts`
still use `ctor.name` (the subclass name) instead of `polymorphicName(ctor)`:

- `loadHasOne` read filter — `packages/activerecord/src/associations.ts:1316`
  (`[typeCol]: ctor.name`)
- `buildHasOne`/build attrs — `associations.ts:1365`
- `loadHasMany` read filter — `associations.ts:1554`
- has_many polymorphic query condition — `associations.ts:1628`
- has_one/has_many `:through` polymorphic join writes — `associations.ts:2296`,
  `associations.ts:2388`

For an STI **subclass** owner (e.g. a `SpecialPost`), these read/write
`"SpecialPost"` while the stored/Rails-correct value is the base class name
`"Post"` (Rails `polymorphic_name` = `base_class.name`, foreign_association.rb:36).
This is a read/write asymmetry vs the now-fixed write sites. Not caught by the
wave-2 tests because their owners were base `Post` or their own base classes.

Rails refs: `activerecord/lib/active_record/associations/foreign_association.rb:36`,
`belongs_to_polymorphic_association.rb:28`. trails already has
`polymorphicName` (inheritance.ts) used by `association-scope.ts` (see done
story `join-scope-polymorphic-type-uses-polymorphic-name`).

## Acceptance criteria

- [ ] Every direct-loader/build/through polymorphic `_type` site listed above
      uses `polymorphicName(ctor)` instead of `ctor.name`.
- [ ] A regression test with an STI subclass owner reading/loading a
      polymorphic `as:` has_one/has_many resolves via `base_class.name`.
- [ ] No api:compare / test:compare regression.
