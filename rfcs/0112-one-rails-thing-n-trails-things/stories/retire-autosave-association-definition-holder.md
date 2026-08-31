---
title: "Retire the last `AssociationDefinition` holder literal in `autosave_association`"
status: ready
updated: 2026-08-31
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Retire the last `AssociationDefinition` holder literal in `autosave_association`

## Context

`packages/activerecord/src/autosave-association.ts:295-298` still builds an
ad-hoc holder:

```ts
const assoc: AssociationDefinition = {
  name: reflection.name,
  type: "belongsTo",
  options: reflection.options ?? {},
} as AssociationDefinition;
```

This is the shape RFC 0112's `retire-ad-hoc-association-definition-holders`
retired everywhere else (PR #7227): `AssociationDefinition` is now
`(AssociationReflection | ThroughReflection) & { readonly options }`, so the
literal only satisfies the type through the `as` cast, and its `type` field
carries a macro where a real reflection's `type` is the polymorphic type column
(`reflection.rb`).

It is inert today — the holder is never passed to `_buildAssociationInstance`,
and only `.options` is read off it — which is why it was not enumerated in that
story's acceptance criteria. It should still go: the `reflection` it is built
from is already in hand at the call site.

Surfaced during review of PR #7227.

## Acceptance criteria

- [ ] The literal is deleted and the call site reads `.options` off the
      `reflection` it already has.
- [ ] No `as AssociationDefinition` cast remains at that call site.
- [ ] `pnpm parity:api:extra --package activerecord` non-negative; autosave and
      nested-attributes suites green.
