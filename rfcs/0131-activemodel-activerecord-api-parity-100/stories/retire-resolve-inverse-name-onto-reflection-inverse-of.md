---
title: "Retire _resolveInverseName, the second spelling of Reflection#inverse_name, onto the reflection"
status: draft
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations.ts:252-263` carries
`_resolveInverseName(ownerCtor, assocName, options)`, a trails-only helper with
no Rails counterpart that re-derives the inverse name from raw options:

```ts
if (options.inverseOf === false) return null;
if (typeof options.inverseOf === "string") return options.inverseOf;
if (options.polymorphic) return null;
const refl = ownerCtor._reflectOnAssociation?.(assocName);
const inverseName = refl?.inverseName?.();
return inverseName != null && inverseName !== false ? inverseName : null;
```

Rails has exactly one place this logic lives —
`AssociationReflection#inverse_name` (`reflection.rb:749-754`) over
`automatic_inverse_of` (`:756-772`), reached through `inverse_of`
(`:745-747`) — and the association writers reach it via
`reflection.inverse_of` / `Association#set_inverse_instance`
(`associations/association.rb:139-145`). The helper duplicates the
`inverse_of: false` arm, the polymorphic arm
(`can_find_inverse_of_automatically?`, `reflection.rb:775-782`) and the
`inverse_name` call, so the two can drift — #7435 had to fix its `false`
handling separately from `inverse_name`'s.

Its callers are `has-many-association.ts:432` and
`singular-association.ts:167`, both of which then call the sibling invention
`_wireInverseAssociation` (`associations.ts:266-277`) where Rails calls
`set_inverse_instance`.

## Converged shape

Both call sites go through the reflection — `reflection.inverseOf()` and
`Association#setInverseInstance` (`association.rb:139-145`) — and
`_resolveInverseName` is deleted. `_wireInverseAssociation`'s `hasManyInversing`
arm is `set_inverse_instance`'s own
(`association.rb:141`, `collection_association.rb`), so it converges with it
rather than staying a parallel path.

## Acceptance criteria

- `_resolveInverseName` is gone; `has-many-association.ts` and
  `singular-association.ts` reach the inverse through the reflection.
- No arm of the deleted helper survives as a second spelling of
  `inverse_name`'s `inverse_of: false` / polymorphic guards.
- `pnpm parity:api:extra --package activerecord` drops both names from the
  invented-surface list, and the extra-surface mark is tightened.
- The inverse-association and association-write suites pass on all adapter
  lanes.
