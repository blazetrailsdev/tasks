---
title: "Converge AttributeMethods#initializeGeneratedModules to Rails (don't delete)"
status: ready
updated: 2026-07-06
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`attribute-methods.ts` (`packages/activerecord/src/attribute-methods.ts`) exports
`initializeGeneratedModules(this: AttributeMethodsHost)` whose body only sets
`_attributeMethodsGenerated = false` when already falsy. It was previously
believed dead and slated for deletion (story
`remove-dead-initialize-generated-modules-noop`, PR #3381 — closed). That
deletion was WRONG: it is the api:compare-matched port of a real Rails method
and removing it regressed api:compare for the file from **69/69 (100%) → 68/69
(99%)**.

Rails defines `initialize_generated_modules` in TWO files, chained via `super`:

- `core.rb:334` `initialize_generated_modules` → trails `core.ts:494`
  (wired, delegates to `generatedAssociationMethods`). Correct, untouched.
- `attribute_methods.rb:42` `ClassMethods#initialize_generated_modules` →
  trails `attribute-methods.ts` (the thin stub). Rails body:

  ```ruby
  def initialize_generated_modules # :nodoc:
    @generated_attribute_methods = const_set(:GeneratedAttributeMethods, GeneratedAttributeMethods.new)
    private_constant :GeneratedAttributeMethods
    @attribute_methods_generated = false
    @alias_attributes_mass_generated = false
    include @generated_attribute_methods
    super
  end
  ```

api:compare maps by file, so the wired `core.ts` version (mapped to `core.rb`)
cannot cover `attribute_methods.rb`'s method — the `attribute-methods.ts`
counterpart must exist.

## Goal

Converge the `attribute-methods.ts` `initializeGeneratedModules` to Rails'
`attribute_methods.rb` behavior instead of leaving it a no-op:

- Set `_attributeMethodsGenerated = false` and (the missing piece)
  `_aliasAttributesMassGenerated = false`.
- Mirror Rails' `GeneratedAttributeMethods` module setup as trails models it
  (prototype-accessor install path used by `defineAttributeMethods`), to the
  extent it has a faithful TS analogue.
- Preserve the `super`-chain semantics to the `core.ts` version where trails
  wires the two.
- Verify it is actually invoked at class-init (Rails calls it from the
  `inherited`/included hook at `attribute_methods.rb:267`); if trails never
  calls it, wire the call faithfully rather than leaving it orphaned.

## Acceptance criteria

- [ ] api:compare for `attribute_methods.rb → attribute-methods.ts` stays at
      69/69 (no regression) and the method is no longer a no-op.
- [ ] No stubs: the method does real, Rails-faithful work.
- [ ] `attribute-methods.test.ts` green; api:compare / test:compare delta
      non-negative.
