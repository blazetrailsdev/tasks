---
title: "extra-surface scores a trails-only subclass's override of an inherited Rails member as moved"
status: draft
updated: 2026-09-03
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extra-surface.ts` scores a method a trails-only class inherits-and-overrides
from a Rails base class as `moved` — "the name exists in Rails, just in another
`.rb`" — when the honest verdict is that the override belongs exactly where it
is, on the subclass.

Concretely, `packages/activerecord/src/relation/predicate-builder/deferred-distinct-pk-in.ts`
declares four trails-only Arel node subclasses (`DeferredDistinctPkIn extends
Nodes.In`, `DeferredDistinctPkNotIn extends Nodes.NotIn`, and the `DeferredIds*`
pair). Each overrides `invert`, whose Rails declaration is
`Arel::Nodes::Binary#invert` (`arel/lib/arel/nodes/binary.rb`), and each has a
`constructor`, which scores against `Arel::Attributes::Attribute#initialize`
(`arel/lib/arel/attributes/attribute.rb`). Both are reported as activerecord's
`moved` surface crediting arel `.rb` files.

That is a category error of the same shape RFC 0103 already fixed once for
overridden Ruby FILES: the subclass is trails-only by construction (it has no
Rails counterpart at all), so an override of an inherited member is not a
misplaced port and no rename is owed. A `moved` verdict here also cannot be
retired by any of the four RFC 0130 routes — you cannot delete the override, and
a `@noRailsEquivalent` receipt would assert something false, since the name IS
Rails'. It just inflates `total`, which is gated.

Surfaced on #7425: the file originally carried a file-level blanket whose reason
had to declare `MOVED-BY-SHORT-NAME: constructor invert` to be accepted
(`fileTagVerdict`), which is the workaround this story removes the need for.

## Acceptance criteria

- A member overriding one inherited from a class the TS file `extends` — where
  the extending class itself scores as trails-only surface — is not counted as
  `moved` for the extending file.
- The rule rides on the SUBCLASS's verdict, not on the member name: an override
  on a class that IS a real port of a Rails class stays scored, so a genuinely
  renamed/misplaced port is still caught (the `postgresql/schema-statements-class.ts`
  case `fileTagVerdict` exists for).
- A test in `scripts/api-compare/extra-surface.test.ts` pins both arms.
- `deferred-distinct-pk-in.ts` reports 0 moved, and activerecord's `total` mark
  is tightened by the two names; no `MOVED-BY-SHORT-NAME` declaration is needed
  for that file any more.
