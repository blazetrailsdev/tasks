---
title: "collection-reader-missing-reflection-raises-bare-error"
status: done
updated: 2026-08-28
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7141
claim: "2026-08-27T23:27:55Z"
assignee: "adapter-default-timezone-is-a-config-read-not-the-rails-ivar"
blocked-by: null
closed-reason: null
---

# The collection reader's missing-reflection arm raises a bare `Error`

## Context

`association()` in `packages/activerecord/src/associations.ts` (the collection
reader that builds a `CollectionProxy`) raises a hand-rolled `Error` when the
name resolves to no reflection:

```ts
const assocDef = ctor._reflectOnAssociation(assocName) as unknown as AssociationDefinition | null;
if (!assocDef) {
  throw new Error(`Association "${assocName}" not found on ${ctor.name}`);
}
```

Rails' `Associations#association` raises the real error class at exactly this
guard (`activerecord/lib/active_record/associations.rb:51-62`):

```ruby
def association(name) # :nodoc:
  association = association_instance_get(name)

  if association.nil?
    unless reflection = self.class._reflect_on_association(name)
      raise AssociationNotFoundError.new(self, name)
    end
    ...
```

`packages/activerecord/src/associations/instance-methods.ts` already gets this
right — its `association(name)` and `assertSingularAssociation` both raise
through `_associationNotFound(this, name)`, the trails helper that builds an
`AssociationNotFoundError` with Rails' DidYouMean `corrections`
(`activerecord/lib/active_record/associations/errors.rb`). So the class, the
message and the spell-checked corrections all already exist; only this one call
site does not use them.

Surfaced in PR #7089 while converting this body's `_associations` scan to
`_reflectOnAssociation`. Not introduced by it — the bare `Error` predates the
change.

## Converged shape

`throw _associationNotFound(record, assocName);`, same as
`instance-methods.ts`. Callers that today match on the message string (if any)
move to `instanceof AssociationNotFoundError`.

## Acceptance criteria

- [ ] The guard raises `AssociationNotFoundError` via `_associationNotFound`,
      with Rails' message and `corrections`.
- [ ] No remaining bare `Error` for a missing reflection in `associations.ts`.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative.
