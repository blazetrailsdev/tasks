---
title: "Included<typeof M> types mixin functions as properties, so a Model subclass cannot override toParam"
status: draft
updated: 2026-10-21
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: ["activemodel", "activesupport"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Finding (surfaced by trailmap#73)

A subclass of `ActiveModel::Model` cannot override `toParam` (or any other
Conversion method) with a method:

```ts
class Audit extends Model {
  override toParam(): string {
    return this.name;
  }
}
// TS2425: Class 'Model' defines instance member property 'toParam', but
// extended class 'Audit' defines it as instance member function.
```

Cause: `packages/activemodel/src/conversion.ts:18` types the mixin as
`Included<typeof Conversion>`. That maps each function in the module object
(`conversion.ts:60`: `{ toModel, toKey, toParam, toPartialPath }`) to an
instance **property**, and `Model` extends that interface. Overriding
`to_param` in a model is ordinary Rails (`def to_param = slug`), so
`Included<>` should produce method members a subclass can override.

trailmap worked around it the Rails-sanctioned way (`id` plus `persisted?`,
so `to_param` derives from `to_key`). That only works when the param is the
key, so it is not a substitute for overriding.

## Expected

`class X extends Model { override toParam() {...} }` typechecks, for every
member contributed through `Included<typeof M>`. Add a type-level test in
activemodel.
