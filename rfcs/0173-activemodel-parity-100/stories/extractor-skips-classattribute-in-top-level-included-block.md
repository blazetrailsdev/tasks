---
title: "api-compare: classAttribute inside a top-level Module#included block is credited to no entity"
status: in-progress
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8504
claim: "2026-10-04T22:27:18Z"
assignee: "define-method-attribute-raises-through-missing-attribute"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8471. `scripts/api-compare/extract-ts-api.ts` credits a
`classAttribute.call(Host, "name", …)` site (`collectClassAttributeCalls`, `:3194`) to the
first of `[enclosing, receiver]` that names a harvested class or module (`:1134-1141`).
`enclosingEntity` (`:3287`) walks up to the nearest class or `const` declaration.

A Concern module written as a top-level statement on a `Module` const has neither:

```ts
export const Conversion = new Module() as Module<{…}>;
extend(Conversion, Concern);
Conversion.included(null, function (this: object) {
  classAttribute.call(this, "paramDelimiter", { instanceReader: false, default: "-" });
});
```

There is no enclosing declaration and the receiver is `this`, so `target` is `undefined`
and the site is skipped silently. `class_attribute :param_delimiter`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/conversion.rb:27-33`) then lost its
`param_delimiter=` credit (conversion.rb 9/9 -> 8/9) and `param_delimiter?` fell back to
the bare `paramDelimiter`, which reds `parity:api:predicates`. PR 8471 worked around it
by moving the block and the `defineMethod` seats inside `new Module((mod) => { … })`, the
`action-dispatch/routing/url-for.ts:171-190` shape. `connection-adapters/deduplicable.ts`
and `type/serialize-cast-value.ts` use the top-level shape and would hit the same skip
the moment they gain a `class_attribute`.

## Acceptance criteria

- [ ] A `classAttribute.call(this, …)` inside a top-level `X.included(null, fn)` (or
      `X[included] = fn`) statement is credited to module `X`, where `X` is an exported
      `new Module()` const in the same file, exactly as the in-initializer shape is.
- [ ] A fixture test in `scripts/api-compare/` covers the top-level shape and fails on
      the current extractor.
- [ ] `pnpm parity:api` totals do not drop; `parity:api:extra:gate` stays OK.
