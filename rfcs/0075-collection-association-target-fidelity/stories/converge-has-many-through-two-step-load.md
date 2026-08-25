---
title: "Converge has_many :through off the two-step load onto the scope chain"
status: draft
updated: 2026-08-08
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #6236, which retired the module-level `findTarget` engine exports.
With the engines module-private, the last non-Rails shape left in the has_many
`:through` load is the **two-step loader itself**:
`HasManyThroughAssociation#loadHasManyThrough`
(`packages/activerecord/src/associations/has-many-through-association.ts`),
reached from `has-many-association.ts`'s module-private loader when
`_routeThroughViaAssociationScope` says the shape cannot be built as a JOIN. It
loads the through records with one query and the targets with a second.

Rails has no such path. `HasManyThroughAssociation#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:225-231`)
is:

```ruby
def find_target
  return [] unless target_reflection_has_associated_record?
  return scope.to_a if disable_joins
  super
end
```

— i.e. `target_reflection_has_associated_record?`, the `disable_joins` arm, then
`CollectionAssociation#find_target`'s single `scope.to_a`
(`collection_association.rb`, `association.rb:248`). The JOIN is built by
`AssociationScope` for _every_ through shape; there is no second query and no
"routable" predicate.

The residue is measurable: #6236 baselined a `find_target` / `scope`
call-mismatch row against
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/has-many-through-association.json`
precisely because the compared body delegates instead of calling `scope`.

This is the has_many sibling of the already-filed
`converge-singular-through-two-step-load` (0023), which does the same for
`has_one :through`; the two share `_routeThroughViaAssociationScope`
(`associations.ts`) as the gate to delete.

## Converged shape

- `AssociationScope` builds the JOIN for the shapes
  `_routeThroughViaAssociationScope` currently rejects (nested through,
  polymorphic-has_many source, unsaved-owner in-memory through step), so the
  predicate always answers yes.
- `_routeThroughViaAssociationScope` and `loadHasManyThrough` are deleted, along
  with the module-private helpers only it uses.
- `HasManyThroughAssociation#findTarget` reduces to Rails' three lines
  (`has_many_through_association.rb:225-231`).
- The `find_target` / `scope` row in
  `call-mismatches-exclude/activerecord/associations/has-many-through-association.json`
  is deleted (only-shrink), not re-reasoned.

## Acceptance criteria

- [ ] `loadHasManyThrough` and `_routeThroughViaAssociationScope` are gone.
- [ ] `HasManyThroughAssociation#findTarget` matches
      `has_many_through_association.rb:225-231` line for line.
- [ ] The `find_target` / `scope` baseline row for that file is deleted.
- [ ] `has-many-through-associations.test.ts` and the nested-through /
      polymorphic-source suites pass with no test renames, on all lanes.
