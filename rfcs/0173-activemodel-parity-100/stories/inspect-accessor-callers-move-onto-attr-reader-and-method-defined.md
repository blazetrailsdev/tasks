---
title: "activemodel: LazilyDefineAttributes#define_on and attribute_method? still walk prototypes through inspectAccessor"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8441
claim: "2026-10-03T10:25:22Z"
assignee: "attribute-method-pattern-drops-camel-joined-recasing"
blocked-by: null
closed-reason: null
---

## Context

Left over from `confirmation-and-acceptance-validators-re-derive-defaults-rails-merges-in-initialize`,
whose acceptance criteria pointed at `activemodel-burn-extra-surface-to-zero` for deleting
`inspectAccessor`. That story closed with the helper receipted `@noRailsEquivalent PERMANENT`
instead of deleted, so it still has two callers.

`inspectAccessor` (`packages/activemodel/src/validations/_accessor.ts`) is a hand-rolled prototype
walk that Rails has no counterpart for. ruby-compat now has the seats it stood in for:
`rbModMethodDefined` (`Module#method_defined?`, `vendor/ruby/v3.3.11/vm_method.c:2055`) and
`rbModAttrReader` / `rbModAttrWriter` (`vendor/ruby/v3.3.11/object.c:2279,2335`), which
`ConfirmationValidator#setupBang` uses.

The two remaining callers:

- `LazilyDefineAttributes#defineOn` (`packages/activemodel/src/validations/acceptance.ts`), where
  Rails calls `attr_reader(*attr_readers)` / `attr_writer(*attr_writers)` on the module itself
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/acceptance.rb:63-64`). The port
  open-codes `Object.defineProperty` inside `moduleEval`. `rbModAttrReader` takes a class
  (`{ prototype }`), so it needs to accept a `Module`'s carrier too.
- `isAttributeMethod` (`packages/activemodel/src/validations.ts`), the port of
  `attribute_method?` (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:282-284`),
  which is `method_defined?(attribute)`.

## Acceptance criteria

- [ ] `LazilyDefineAttributes#defineOn` calls the `attr_reader` / `attr_writer` seat on the module.
- [ ] `isAttributeMethod` is `rbModMethodDefined(this, attribute)`.
- [ ] `validations/_accessor.ts` is deleted, and `pnpm parity:api:extra --package activemodel`
      still reports total 0.
- [ ] `acceptance-validation.test.ts`, `acceptance-validation.trails.test.ts` and
      `validations.test.ts` stay green.
