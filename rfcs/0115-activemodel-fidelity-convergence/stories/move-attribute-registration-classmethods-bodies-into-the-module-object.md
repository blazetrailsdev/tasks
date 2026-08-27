---
title: "move-attribute-registration-classmethods-bodies-into-the-module-object"
status: draft
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `group-model-ts-remaining-inline-mixin-literals-into-module-objects`
(PR #7127), which grouped `forbidden-attributes-protection.ts` and the
`validations.ts` instance half into module objects **carrying the bodies**, per
that story's "Converged shape":

> each module gets an exported module object in its own file **holding the
> bodies** (not references) — `export const ClassMethods = { decorateAttributes(this: …) { … }, … }` — so the object literal IS the module and api-compare
> still measures the bodies for call parity.

`attribute-registration.ts` was left in the reference form and is the last one:

```ts
// packages/activemodel/src/attribute-registration.ts:425-436
export const ClassMethods = {
  attribute,
  decorateAttributes,
  _defaultAttributes,
  attributeTypes,
  typeForAttribute,
  pendingAttributeModifications,
  resetDefaultAttributesBang,
  resolveAttributeName,
  resolveTypeName,
  hookAttributeType,
};
```

The bodies are the top-level `export function`s above it in the same file, so
nothing is currently mis-measured — a reference in the same file is not a
bodyless declaration. It is the shape that differs from the other two modules
and from Ruby's `AttributeRegistration::ClassMethods`
(`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:11-115`),
which declares the bodies inside the module.

## Converged shape

Move the ten bodies into the `ClassMethods` object literal, as
`attribute-methods.ts:221` and `validations.ts`'s `InstanceMethods` already do,
keeping each member's `this:` host typing and JSDoc. `model.ts` re-declares
several of them (`declare static decorateAttributes: typeof decorateAttributes`
and friends, `model.ts:181-235`), so those `typeof` targets move with them.

Watch the trap the sibling story hit: an exported
`interface Host extends Extended<typeof ClassMethods>` IS a bodyless
declaration and outranks the real bodies in api-compare pairing (RFC 0025,
`api-compare-bodyless-declaration-outranks-real-body`). Keep any derived host
interface unexported.

## Acceptance criteria

- [ ] `ClassMethods` in `attribute-registration.ts` holds the method bodies, not
      references; no exported interface derives from it.
- [ ] The file's rows in `scripts/api-compare/call-mismatches-exclude/` are still
      reported after the move (proof the bodies are still measured).
- [ ] `pnpm parity:api:calls` / `:args` green; `pnpm parity:api` /
      `pnpm parity:test` deltas non-negative.
