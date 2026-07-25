---
title: "has-one-through-inherits-direct-fk-set-new-record"
status: claimed
updated: 2026-07-25
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-25T03:26:52Z"
assignee: "has-one-through-inherits-direct-fk-set-new-record"
blocked-by: null
closed-reason: null
---

## Context

`HasOneThroughAssociation` inherits `setNewRecord` from `HasOneAssociation`
(`packages/activerecord/src/associations/has-one-association.ts:543-559`). Its
tail runs `nullifyOwnerAttributes(displaced)` / `removeInverseInstance` and
pushes onto `_displacedRecords` — all of which are direct-FK operations that a
hasOne _through_ target does not support: the end record has no foreign key
back to the owner (which is exactly why
`HasOneThroughAssociation#detachDisplacedTarget` is overridden to a no-op,
`has-one-through-association.ts:104`).

Measured on `main` (and unchanged by PR #5291, which does not touch
`setNewRecord`): an awaited `buildClub(...)` over a **loaded**
`Member hasOne :club, through: :current_membership` raises

    MissingAttributeError: can't write unknown attribute `club_id`

from `nullifyOwnerAttributes` (`has-one-association.ts:568`) via
`setNewRecord` (`:555`) via `SingularAssociation#build`
(`singular-association.ts:37`) via the `build#{name}` accessor
(`builder/has-one.ts:91`). It throws before the queue push, so the
"queued-then-nullified-at-save" variant flagged in review is masked by an
earlier crash for this model — but a through whose end model happens to carry a
column named like the owner's derived FK would instead silently nullify it at
the owner's `save()` drain (`removeDisplaced` -> `removeOne` ->
`removeTargetBang`).

Rails: `HasOneThroughAssociation#replace` routes displacement entirely through
`create_through_record`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:15-40`)
and never touches the end record's attributes.

The existing `has-one-through-associations` suite is green, so it does not
exercise an awaited `build#{name}` / `create#{name}` over a loaded through
target.

Raised by review on PR #5291; pre-existing, deliberately out of that PR's scope.

## Acceptance criteria

- [ ] An awaited `build#{Name}` / `create#{Name}` over a _loaded_ hasOne-through
      target does not raise `MissingAttributeError` and does not nullify /
      queue the displaced end record — displacement stays with the through's
      own `createThroughRecord` / `persistReplace`.
- [ ] Likely shape: `HasOneThroughAssociation` overrides `setNewRecord` (or the
      base gates its direct-FK tail on a non-through reflection), mirroring the
      existing `detachDisplacedTarget` no-op override.
- [ ] Regression test covering awaited build AND create over a loaded through
      target; it must fail on baseline.
- [ ] `has_one` / hasOne-through / autosave / nested-attributes suites green.
