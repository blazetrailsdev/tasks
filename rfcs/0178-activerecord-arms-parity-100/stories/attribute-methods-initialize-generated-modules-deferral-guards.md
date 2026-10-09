---
title: "activerecord: attribute-methods-initialize-generated-modules-deferral-guards"
status: claimed
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps:
  - active-record-base-inherited-chain-needs-one-deferred-dispatch
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-09T19:39:37Z"
assignee: "attribute-methods-initialize-generated-modules-deferral-guards"
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

## Ruling (repo owner, 2026-10-09)

`active-record-base-inherited-chain-needs-one-deferred-dispatch` settled the mechanism, and
trails `packages/activerecord/CLAUDE.md` § "`inherited` is deferred to own-property memo guards"
records it: every `inherited` link under `ActiveRecord::Base` is ported as the own-property
guard. A reset ivar is answered only as an own property, and what a link seeds is seeded at the
subclass's first read. No link is ported as a method and nothing dispatches the chain. This
story is re-specified against that section; the criteria below replace the earlier ones.

## Acceptance criteria

- [ ] The first-read seed of `initializeGeneratedModules` has one site: the reader of the class's
      own `_generatedAttributeMethods`. `aliasAttribute`, `defineAttributeMethods`,
      `generateAliasAttributes`, `isInstanceMethodAlreadyImplemented`,
      `encryption/encryptable-record.ts` `overrideAccessorsToPreserveOriginal` and `core.ts`
      `generatedAssociationMethods` reach it through that reader and carry no own-property test
      of their own, so each opens with Rails' first statement.
- [ ] `initializeGeneratedModules` is `attribute_methods.rb:42-50` line for line, with no
      previous-module arm: with one seed site it runs once per class.
- [ ] The `@inventedArm if` receipts on those declarations are deleted, and the one seed site
      carries `@inventedArm … — PERMANENT`. The invented report shows no unreceipted row for
      them.
