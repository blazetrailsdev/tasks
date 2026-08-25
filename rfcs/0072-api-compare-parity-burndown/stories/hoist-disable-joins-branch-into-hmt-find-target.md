---
title: "Hoist the disable_joins branch into HasManyThroughAssociation#findTarget"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6113
claim: "2026-08-05T02:15:00Z"
assignee: "converge-mysql-version-string-single-raise-site"
blocked-by: null
closed-reason: null
---

## Context

Noted by review on #6097 (`through-find-target-becomes-instance-method`), not
blocking. `HasManyThroughAssociation#findTarget` now exists as a real instance
method
(`packages/activerecord/src/associations/has-many-through-association.ts`),
but its decomposition differs from Rails'.

Rails
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:225-230`):

```ruby
def find_target(async: false)
  raise NotImplementedError, "No async loading for HasManyThroughAssociation yet" if async
  return [] unless target_reflection_has_associated_record?
  return scope.to_a if disable_joins
  super
end
```

Three explicit statements. trails ports the first guard and `super`, but has
no `disable_joins` branch of its own: the disable-joins shape is detected one
level down, inside the shared `HasManyAssociation` module-level loader
(`_canRouteThroughViaDisableJoinsAssociationScope` →
`_loadThroughViaDisableJoinsScope` in
`packages/activerecord/src/associations/has-many-association.ts`).
Behaviourally equivalent today — the loader gates on it before doing anything
else — but a Rails dev reading `find_target` does not see the branch Rails
puts there, and a future change to the loader's routing could silently move
the boundary.

## Converged shape

Hoist the branch into the method so the body reads as Rails' three
statements: `if (this.disableJoins) return this.scope().toArray();` between
the `targetReflectionHasAssociatedRecord()` guard and `super.findTarget()`.
The routing predicate currently lives with the loader, so this needs the
disable-joins decision to be readable from the association instance without
duplicating `_canRouteThroughViaDisableJoinsAssociationScope`'s logic in two
places — that is the work.

Sequence after `retire-module-level-find-target-engine-exports`, which moves
the loader behind the instance method and makes the hoist tractable.

## Acceptance criteria

- [ ] `HasManyThroughAssociation#findTarget` carries the `disable_joins`
      branch itself, in Rails' statement order.
- [ ] The routing predicate is not duplicated — the loader and the method
      agree by construction.
- [ ] Disable-joins through suites pass unchanged, no test renames.
