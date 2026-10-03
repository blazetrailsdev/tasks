---
title: "activemodel: Validations#freeze calls Object.freeze where Rails calls super; init_internals omits @errors = nil"
status: ready
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left after trails PR 8408 moved ActiveModel's `super`-calling methods onto `Module#superMethod`.
Two `ActiveModel::Validations` bodies still differ from Rails
(`packages/activemodel/src/validations.ts`):

- `Validations#freeze` (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:372-377`)
  is `errors; context_for_validation; super`. trails' body ends in `Object.freeze(this); return this`
  where Rails calls `super`. It is a class-body member of the `Validations` class-module, which
  `include()` copies onto the includer's prototype, so it cannot reach a next implementation at all.
- `Validations#init_internals` (`validations.rb:467-471`) is `super; @errors = nil;
@context_for_validation = nil`. trails' body sets only `_contextForValidation` and omits
  `@errors = nil`.

## Converged shape

`freeze` joins `initializeDup` and `initInternals` on the module-private `Module` link in
`validations.ts`, and ends in `<Module>.superMethod(this, "freeze")!()`. ruby-compat's `Kernel`
already answers `freeze` at the root (`packages/ruby-compat/src/include.ts`), so no root is needed.
`initInternals` assigns `_errors` as Rails does.

Watch the ancestry: `Attributes#freeze` (`attributes.rb:150-153`) sits above `Validations` and
reaches it through `super`; today it finds the copied class-body `freeze` on `Model.prototype`.

## Acceptance criteria

- [ ] `Validations#freeze` ends in `super` through `superMethod`, with no direct `Object.freeze` call.
- [ ] `Validations#initInternals` sets `_errors` and `_contextForValidation`, in Rails' order.
- [ ] `packages/activemodel/src/attributes.trails.test.ts` ("Attributes#freeze") and `validations.test.ts` stay green.
