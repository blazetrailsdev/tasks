---
title: "Group attribute-methods.ts into real ClassMethods / InstanceMethods module objects"
status: in-progress
updated: 2026-08-26
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: ["activemodel"]
deps:
  - api-compare-bodyless-declaration-outranks-real-body
deps-rfc: []
est-loc: 420
pr: 7103
claim: "2026-08-26T20:28:08Z"
assignee: "group-attribute-methods-into-classmethods-instancemethods-modules"
blocked-by: null
closed-reason: null
priority: 8
---

## Context

Surfaced by #6798 (`retire-activemodel-this-rebinding-thunks`).

Rails' `activemodel/lib/active_model/attribute_methods.rb` is a module with a
nested `module ClassMethods` (attribute_methods.rb:74) holding
`attribute_method_prefix`, `attribute_method_suffix`, `attribute_method_affix`,
`alias_attribute`, `define_attribute_methods`, `undefine_attribute_methods`,
`resolve_attribute_name`, `generated_attribute_methods`,
`instance_method_already_implemented?`, `attribute_method_patterns_cache`,
`attribute_method_patterns_matching`, `define_proxy_call`, … — plus the
module's own instance methods `attribute_missing`,
`respond_to_without_attributes?`, `attribute_method?`,
`matched_attribute_method`, `missing_attribute`, `_read_attribute`
(attribute_methods.rb:520-560).

trails has none of that grouping: every member is a bare top-level
`export function` in `packages/activemodel/src/attribute-methods.ts`, and the
two module identities exist only as **local, non-exported** host types
(`ClassMethods`, `InstanceMethods`, added by #6798) plus inline object literals
passed to `extend(Model, …)` / `include(Model, …)` at the bottom of
`packages/activemodel/src/model.ts`. A reader cannot tell from the file which
members are ClassMethods and which are instance methods, and every new host has
to re-list all 15 names by hand.

PR #6798 tried the obvious convergence — exported `ClassMethods` /
`InstanceMethods` module objects, per CLAUDE.md "Module mixins" — and had to
back it out: an exported declaration whose members are Rails method names
outranks the file's real function bodies in api-compare pairing and silently
retired four live call-ratchet rows. See
`0025-fidelity-verification-tooling/stories/api-compare-bodyless-declaration-outranks-real-body`.
That is why the types are local today, and it is what gates this story.

## Converged shape

Once the pairing defect is fixed, hold the **bodies** in the module objects
rather than referencing them:

```ts
export const ClassMethods = {
  attributeMethodPrefix(this: …, …) { … },
  …
};
export const InstanceMethods = { attributeMissing(this: …, …) { … }, … };
```

so the object literal is the module (bodies included, so call-parity still
measures them), `AttributeMethodHost` becomes
`Extended<typeof ClassMethods> & { …ivars… }`, `InstanceHost` becomes
`Included<typeof InstanceMethods> & { … }`, and `model.ts` reduces to
`extend(Model, AttributeMethods.ClassMethods)` /
`include(Model, AttributeMethods.InstanceMethods)`. Same treatment for the
inline literals #6798 left in `model.ts` for AttributeRegistration, Validations
and ForbiddenAttributesProtection.

Note the ordering constraint #6798 established: the AttributeMethods `extend`
must run before `include(Model, Attributes)`, because `Attributes`' `included`
hook issues `attributeMethodSuffix("=", …)` (attributes.rb:35-37).

## Acceptance criteria

- `attribute-methods.ts` exports `ClassMethods` and `InstanceMethods` module
  objects carrying the method bodies, named as attribute_methods.rb:74 and
  :520-560 name them.
- `AttributeMethodHost` / `InstanceHost` derive from them via `Extended<>` /
  `Included<>`; no hand-maintained parallel list of member signatures.
- `model.ts` wires them with one `extend()` and one `include()`, and the
  per-name `declare static` block collapses accordingly.
- The rows in
  `scripts/api-compare/call-mismatches-exclude/activemodel/attribute-methods.json`
  are still reported — proof the bodies are still being measured. As of
  2026-08-26 that file holds two rows, `define_call`/`match?` and
  `resolve_attribute_name`/`fetch`; the four this criterion originally named
  (`resolve_attribute_name`/`fetch`, `attribute_method_patterns_cache`/`new`,
  `attribute_method?`/`attributes`,
  `attribute_method?`/`respond_to_without_attributes?`) were never all present
  — read the file, not this list. A row that appears BECAUSE the grouping
  restored a pairing a bodyless declaration had been winning is expected, and
  converges or is baselined with a real reason like any other.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:extra --package activemodel` does not rise.
