---
title: "converge-instantiatesti-into-ported-instantiate"
status: claimed
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-27T00:14:55Z"
assignee: "converge-instantiatesti-into-ported-instantiate"
blocked-by: null
closed-reason: null
---

## Context

Found while classifying `inheritance.ts` extra surface (#5342). The original
allowlist reason for `instantiateSti` claimed Rails overrides
`Persistence::ClassMethods#instantiate` in inheritance.rb and that trails cannot
override a static across the mixin boundary. **That is wrong.** Rails has exactly
one entry point (persistence.rb:100-103):

```ruby
def instantiate(attributes, column_types = {}, &block)
  klass = discriminate_class_for_record(attributes)
  instantiate_instance_of(klass, attributes, column_types, &block)
end
```

`discriminate_class_for_record` (inheritance.rb:299) and
`instantiate_instance_of` (persistence.rb:311) are both private class methods; STI
dispatch is _inside_ `instantiate`, not beside it. trails' `persistence.ts:145`
`instantiate` already reproduces this faithfully.

So `instantiateSti` (`inheritance.ts:767`) is a genuine second hydration path, not
a necessary shim. It wraps `directInstantiate`, a private duplicate of the
hydration logic whose stated purpose is "avoids recursion". Its only real caller
is `base.ts:_instantiate` (`base.ts:2954-2966`).

**The hard part** (why this is its own story, not a rename): the recursion guard
in `base.ts:_instantiate` is `row[inheritanceCol] !== this.name`. `this.name` is
the JS class name, but the stored type value is `stiName(klass)` — for a
namespaced model with `storeFullStiClass` on, those differ (`"ClothingItem::Used"`
vs the flattened JS name `ClothingItemUsed`, see `qualifiedName` /
`_demodulizedName` in inheritance.ts:226). Re-entering `_instantiate` on the
resolved class would therefore not terminate, which is precisely why
`directInstantiate` exists. Converging means replacing the name comparison with a
`klass !== this` identity guard and collapsing to a single hydration path.

## Acceptance criteria

- Replace the `row[inheritanceCol] !== this.name` guard in `base.ts:_instantiate`
  with an identity comparison against the class `discriminateClassForRecord`
  resolves, so the guard is correct for `storeFullStiClass` namespaced models.
- Collapse `instantiateSti` + `directInstantiate` into the single hydration path;
  delete `instantiateSti` and drop it from `index.ts`.
- Remove the corresponding `extra-surface-allow.json` entry.
- Add a regression test that fails on baseline for the namespaced
  `storeFullStiClass` case if the identity guard is what fixes it (see
  inheritance-namespaced.test.ts and the `ClothingItem::Used` fixtures).
- This is the hot instantiate path: run inheritance.test.ts,
  inheritance-namespaced.test.ts, sti-attribute-routing.test.ts,
  model-schema-load.test.ts, persistence.test.ts and the eager/association
  suites before and after.
- api:compare and test:compare deltas non-negative.
