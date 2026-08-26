---
title: "group-model-ts-remaining-inline-mixin-literals-into-module-objects"
status: draft
updated: 2026-08-26
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `group-attribute-methods-into-classmethods-instancemethods-modules`
(PR grouping `packages/activemodel/src/attribute-methods.ts` into exported
`ClassMethods` / `InstanceMethods` module objects that carry the bodies). That
story's "Converged shape" also asked for the same treatment for the inline
object literals #6798 left in `packages/activemodel/src/model.ts`; they were
left out to keep that PR reviewable and are registered here.

Three literals remain at the bottom of `model.ts`:

- `extend(Model, { decorateAttributes, attributeTypes, typeForAttribute,
_defaultAttributes, pendingAttributeModifications, resetDefaultAttributesBang,
resolveTypeName, hookAttributeType })` — Ruby
  `ActiveModel::AttributeRegistration::ClassMethods`
  (attribute_registration.rb:10-…), whose members live in
  `attribute-registration.ts` as bare top-level `export function`s.
- `include(Model, { contextForValidation, runValidationsBang,
raiseValidationError, readAttributeForValidation, freeze, … })` — the
  instance half of `ActiveModel::Validations` (validations.rb:52).
- `sanitizeForMassAssignment` / `sanitizeForbiddenAttributes` in that same
  literal — `ActiveModel::ForbiddenAttributesProtection`
  (forbidden_attributes_protection.rb:14-24).

## Converged shape

As in the attribute-methods story: each module gets an exported module object in
its own file **holding the bodies** (not references) —
`export const ClassMethods = { decorateAttributes(this: …) { … }, … }` — so the
object literal IS the module and api-compare still measures the bodies for call
parity. A reference-only literal must NOT be used: a bodyless/reference
declaration outranks the real body in api-compare pairing and silently retires
call-ratchet rows (RFC 0025,
`api-compare-bodyless-declaration-outranks-real-body`).

Note the trap that story hit: an exported `interface Host extends
Extended<typeof ClassMethods>` is itself such a bodyless declaration and does
outrank the bodies. Keep the derived host interface **unexported**, exporting
only the ivar-carrying state interface, and re-check the file's rows in
`scripts/api-compare/call-mismatches-exclude/` before and after.

## Acceptance criteria

- `attribute-registration.ts`, `validations.ts` and
  `forbidden-attributes-protection.ts` export module objects carrying the method
  bodies, named as their Rails counterparts name them.
- `model.ts` wires each with a single `extend()` / `include()`; no per-member
  object literal remains for them.
- The rows those files already have in
  `scripts/api-compare/call-mismatches-exclude/` are still reported after the
  move (proof the bodies are still measured), and `pnpm parity:api:calls` /
  `pnpm parity:api:calls:args` stay green.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
