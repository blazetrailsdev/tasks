---
title: "Delete displacementNeedsAwait so the nested writer has one build arm"
status: blocked
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6192
claim: "2026-08-07T18:48:45Z"
assignee: "strptime-sec-fraction-numerator-is-a-number"
blocked-by: "Attempted in PR #6192 and reverted; the blocker is real and, per RFC 0087's own Open Questions, permanent rather than pending. Deleting displacementNeedsAwait and letting the writer always return detachDisplacedThenSetNewRecord reds three files, two of them ported Rails tests: forbidden-attributes-protection.test.ts:141 ('strong params style objects work with singular associations' — new ShipPart(params) then a SYNCHRONOUS part.ship.readAttribute('name'), which reads null), associations/nested-error.test.ts:136 ('no index when singular association' — new PetOwner({petAttributes:{name:null}}) then owner.association('pet').target), and associations/has-one-sync-build-displacement.trails.test.ts:66 ('keeps the writer synchronous when the assignment displaces nothing', which pins the predicate directly). The story's own acceptance criterion 3 is what fails. NOTE the trap that makes this look shippable: nested-attributes.test.ts (163 cases), -trails, -with-callbacks, -displaced-removal-failure, -unloaded-update, has-one-associations.test.ts and has-one-through-associations.test.ts ALL stay green with the branch forced always-await, because create/createBang route through _reapplyNestedAttrSetters' parkNestedReaderLoad drain (persistence.ts:1077-1094). The drain covers create/create!, NOT a plain Model.new followed by a synchronous association read — which is exactly what the three failing tests do. Selecting test files by the 'nested' name pattern misses all three. The unblocker named in the story ('once construction itself can await') is resolved AGAINST it by RFC 0087 README Open Questions: 'new Foo({account: x}) keeps assigning in memory, synchronously, and needs no awaitable form ... an async Model.new would be a deviation rather than a convergence'. So this cannot converge by waiting for a constructor path that can await; it needs the RFC to first decide something different, or it should be closed as won't-do. Retargeting suggestion: the sibling grep-gate-sync-association-writers-to-zero already narrowed from seven symbols to four for the same underlying reason (a permanently synchronous assignAttributes, RFC 0087 README section 2), and displacementNeedsAwait belongs in that same 'deliberate residue' bucket rather than in the deletion set."
closed-reason: null
---

## Context

The last shim left behind by `delete-nested-attributes-deferred-displacement`
(PR #6167). Rails' `HasOneAssociation#replace` just runs its steps:

```ruby
# vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84
def replace(record, save = true)
  raise_on_type_mismatch!(record) if record
  return target unless load_target || record
  ...
  remove_target!(...) if target && !target.destroyed? && ...
  self.target = record
end
```

trails asks first, via `HasOneAssociation#displacementNeedsAwait`
(`packages/activerecord/src/associations/has-one-association.ts:509`, overridden
to `false` in `has-one-through-association.ts:205`), and the nested-attributes
writer branches on it (`nested-attributes.ts`, the `assoc.displacementNeedsAwait?.()`
arm). It has no Rails counterpart: it exists so a nested assignment that
displaces nothing stays SYNCHRONOUS, which is what keeps
`new Pirate({ shipAttributes: {...} })` building its ship inside the constructor
the way Ruby's `#{name}_attributes=` does (nested_attributes.rb:401-404).

So the predicate is not gratuitous — it is load-bearing for constructor timing —
but it is still a branch Rails does not have, and both arms exist only because
the construction path cannot await.

## Converged shape

Once construction itself can await (or once nested-attributes construction is
staged so the writer may always answer a promise), delete
`displacementNeedsAwait` and both its overrides, and let the writer run
`detachDisplacedThenSetNewRecord` unconditionally — `load_target` (:59) ->
`remove_target!` (:69) -> `self.target = record` (:84), one path, as Rails has.
The `has_one_through` override disappears with it: a through `replace` has no
`load_target`, so its `loadDisplacedForBuild` / `detachDisplacedTarget` no-ops
already express that.

Blocked on: a constructor path that can await, i.e. the `Model.new`/`create`
staging question. `grep-gate-sync-association-writers-to-zero`
(0087) is the sibling that closes the writer surface.

## Acceptance criteria

- `displacementNeedsAwait` and its `HasOneThroughAssociation` override are gone.
- `assignNestedAttributesForOneToOneAssociation` has one build arm, not two.
- `new Model({ assocAttributes: {...} })` still assigns the nested record with
  Rails' timing (pinned by `assigns constructor nested attributes without the
property setter`, `nested-attributes.trails.test.ts`).
