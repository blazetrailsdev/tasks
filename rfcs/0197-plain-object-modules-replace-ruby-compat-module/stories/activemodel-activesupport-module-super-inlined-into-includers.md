---
title: "activemodel-activesupport-module-super-inlined-into-includers"
status: in-progress
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9178
claim: "2026-10-21T14:04:34Z"
assignee: "activemodel-activesupport-module-super-inlined-into-includers"
blocked-by: null
closed-reason: null
---

## Context

Left as ruby-compat `Module` by the activemodel / activesupport / did-you-mean
plain-object conversion, because each needs a module `super` inlined into its
includers (CLAUDE.md § "A module method's `super` is inlined the same way"),
a live include, or a class module:

Module `super` (`superMethod(`):

- `packages/activemodel/src/attributes.ts` `SuperMethods` (`initializeDup`, `freeze`; `attributes.rb`)
- `packages/activemodel/src/dirty.ts` `SuperMethods` (`initializeDup`, `initAttributes`, `asJson`, `initInternals`; `dirty.rb`)
- `packages/activemodel/src/validations.ts` `SuperMethods` (`initializeDup`, `freeze`, `initInternals`)
- `packages/activemodel/src/validations/callbacks.ts` `SuperMethods` (`runValidationsBang`)
- `packages/activesupport/src/message-pack/cache-serializer.ts` `CacheSerializer#load` (`message_pack/cache_serializer.rb`), and its super target `message-pack/serializer.ts` `Serializer`
- `packages/did-you-mean/src/core-ext/name-error.ts` `Correctable#detailed_message`; Correctable is also prepended at run time by `DidYouMean.correct_error` (`did-you-mean.ts:21-22`)

Super target reached by a test's `super`:

- `packages/activemodel/src/type/serialize-cast-value.ts` `SerializeCastValue` / `DefaultImplementation` (`serialize_cast_value.test.ts` reaches `DefaultImplementation#serialize_cast_value` through `super`)

Live include (methods defined after the module is included):

- `packages/activemodel/src/attribute-methods.ts` `generatedAttributeMethods`
- `packages/activesupport/src/current-attributes.ts` `generatedAttributeMethods`

Class module needed (singleton and instance `descendants` share a name):

- `packages/activesupport/src/descendants-tracker.ts` `DescendantsTracker`

`instanceof Module` checks that stay while any `Module` exists in the repo:
`class-attribute.ts:25`, `delegation.ts:78,127`, `code-generator.ts:58,121`,
`module-ext.ts:85,122`, `rescuable.ts:58`.

## Acceptance criteria

- Each site above is a plain-object or class module, with each module `super`
  inlined into its includers with `@inlinedFrom`, or the owner's ruling for it
  is recorded.
- No `new Module` / `instanceof Module` remains in activemodel, activesupport
  or did-you-mean.
