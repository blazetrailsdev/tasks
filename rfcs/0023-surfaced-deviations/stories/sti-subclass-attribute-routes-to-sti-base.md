---
title: "STI subclass attribute() routes to the STI base, unlike Rails' per-class pending modifications"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Base.attribute` routes an STI subclass declaration to the STI base
(`isStiSubclass(this) ? getStiBase(this) : this`), so a subclass `attribute()`
writes into the base-owned `_attributeDefinitions` and every sibling subclass
sees the declaration. `sti-attribute-routing.test.ts` pins this behaviour today:

```ts
expect(Circle._attributeDefinitions).toBe(Shape._attributeDefinitions);
expect(Object.prototype.hasOwnProperty.call(Circle, "_attributeDefinitions")).toBe(false);
```

Rails is per-class here, exactly as it is for `encrypts`. `attribute` pushes onto
the RECEIVER's `pending_attribute_modifications`
(`activemodel/lib/active_model/attribute_registration.rb:12-21`), the same buffer
`decorate_attributes` uses, and `_default_attributes` replays the superclass's
modifications first and then only the class's own
(`attribute_registration.rb:31-34`, `:81-88`). A subclass `attribute()` therefore
must not be visible on the STI base or its siblings.

This is the same deviation family as
`sti-subclass-encrypts-routes-to-sti-base-leaking-type` (fixed in #4985), which
removed the identical routing from `Base.encrypts`. `attribute()` is the last
remaining member of the base-routing bucket. #4981 already provides the
machinery that made the `encrypts` fix safe: `decorateAttributes` copy-on-writes
`_attributeDefinitions` onto the calling class and `rebuildStiSubclassOverlay`
keeps the subclass overlay in sync with the base.

Note this one is higher risk than the `encrypts` fix: `attribute()` is on the
hot declaration path for every model, and prototype accessors are defined from
the base's map, so per-subclass divergence interacts with the accessor/
`ignoredColumns` note in `model-schema.ts` (see `applyColumnsHash`).

## Acceptance criteria

- [ ] Decide whether the `attribute()` STI base-routing can be removed, or
      document the accessor/prototype constraint that forces it to stay.
- [ ] If removed: a subclass `attribute()` declaration is invisible on the STI
      base and sibling subclasses, with a guard test mirroring
      `encrypted-attribute-sti.trails.test.ts` (the subclass must drive the FIRST
      reflection of the STI table or the guard silently stops guarding).
- [ ] Update `sti-attribute-routing.test.ts`, which currently asserts the shared-map
      behaviour.
- [ ] Update the STI note in `model-schema.ts` `applyColumnsHash`, which names
      `attribute()` as the remaining base-routing flow.
