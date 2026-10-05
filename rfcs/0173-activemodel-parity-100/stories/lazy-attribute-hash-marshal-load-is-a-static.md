---
title: "activemodel: LazyAttributeHash.marshalLoad is a static; Rails' marshal_load re-initializes the instance"
status: draft
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LazyAttributeHash.marshalLoad` (`packages/activemodel/src/attribute-set/builder.ts:253-263`) is a
`static` that constructs and returns a new instance. Rails' is an instance method that re-runs
`initialize` on the allocated object
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:146-148`):
`def marshal_load(values); initialize(*values); end`. ruby-compat's `Marshal.load` allocates and then
sends `marshalLoad` to the instance (`TYPE_USRMARSHAL`, `packages/ruby-compat/src/marshal.ts`), so the
static is never reached and a dumped `LazyAttributeHash` cannot be loaded. trails#8525 converged the
same shape on `UserProvidedDefault#marshalLoad`.

Its one caller is `packages/activemodel/src/attribute-set/builder-defaults.trails.test.ts:80-89`.

## Acceptance criteria

- [ ] `LazyAttributeHash#marshalLoad(values)` is an instance method that initializes the receiver
      from `values`, as `builder.rb:146-148` does, and takes any array.
- [ ] `Marshal.load(Marshal.dump(lazyAttributeHash))` answers an equal hash; a trails test pins it.

## Verification

```bash
pnpm vitest run packages/activemodel/src/attribute-set/builder-defaults.trails.test.ts
```
