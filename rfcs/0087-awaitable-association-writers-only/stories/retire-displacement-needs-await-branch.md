---
title: "Delete displacementNeedsAwait so the nested writer has one build arm"
status: closed
updated: 2026-08-14
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6192
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do: cannot converge as written. Attempted in PR #6192 and reverted; RFC 0087's own Open Questions resolve the named unblocker against it ('new Foo({account: x}) keeps assigning in memory, synchronously ... an async Model.new would be a deviation rather than a convergence'). displacementNeedsAwait joins the deliberate-residue bucket alongside grep-gate-sync-association-writers-to-zero's narrowing from seven symbols to four."
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
