---
title: "activerecord: attribute-methods-initialize-generated-modules-deferral-guards"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps:
  - active-record-base-inherited-chain-needs-one-deferred-dispatch
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

Rails calls `initialize_generated_modules` once per class from `Core::ClassMethods#inherited`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb`), so
`attribute_methods.rb:42-50` runs before any other class-level attribute method. JS has no
`inherited` hook, and `packages/activerecord/src/attribute-methods.ts` defers it with an
own-property guard, `if (!hasOwnProperty(this, "_generatedAttributeMethods")) initializeGeneratedModules.call(this)`,
opening `aliasAttribute`, `defineAttributeMethods`, `generateAliasAttributes` and
`isInstanceMethodAlreadyImplemented` (and `encryption/encryptable-record.ts`
`overrideAccessorsToPreserveOriginal`, `core.ts` `generatedAssociationMethods`).
`initializeGeneratedModules` itself adds two arms Rails lacks: it reads a previous own module
and removes its methods before `const_set`, covering a second call Rails never makes.
Reported by `pnpm parity:api:arms:report --package=activerecord --direction=invented` as `+if` on
`aliasAttribute`, `generateAliasAttributes`, `isInstanceMethodAlreadyImplemented` and `+if +if`
on `initializeGeneratedModules`; each carries `@inventedArm if`.

## Acceptance criteria

- [ ] The deferral runs from one place, so the four class methods open with Rails' first statement.
- [ ] `initializeGeneratedModules` is `attribute_methods.rb:42-50` line for line, with no previous-module arm.
- [ ] The `@inventedArm if` receipts on those five declarations are deleted and the invented report shows no row for them.
