---
title: "ruby-compat ancestry readers walk through a DelegateClass and rbModAncestors answers links"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8366 (`activemodel-burn-extra-surface-to-zero`).

Ruby's `DelegateClass(superclass)` is `Class.new(Delegator)` (`delegate.rb:394`), so the generated class has
no `superclass` in its ancestry. trails' `DelegateClass` (`packages/ruby-compat/src/delegate.ts`) keeps
`superclass.prototype` in the prototype chain so `instanceof` holds. PR 8366 marked the generated prototype
and made two walks in `packages/ruby-compat/src/include.ts` stop there: `isModuleMethodTablePresent` (the
"already in the ancestry" check `include()` / `prepend()` use) and `initializeIncludedModules`.

Three other ancestry readers still walk through the boundary:

- `isModuleIncluded` (`Module#<`) and `includedModules` (`Module#included_modules`) in `include.ts`, which
  answer for a delegate class as if it had the delegated class's mixins.
- `rbModAncestors` / `rbModInstanceMethod` in `packages/ruby-compat/src/object.ts`, which include the
  delegated class's method tables. They also answer method-table LINKS (a class's prototype, or the link a
  `Module` contributed) where `rb_mod_ancestors` (`vendor/ruby/v3.3.11/class.c:1570`) answers the classes and
  modules themselves, and a plain-object or class module copied onto a prototype has no entry of its own.

## Converged shape

Every ancestry reader stops at a `DelegateClass` prototype, and `rbModAncestors` answers classes and `Module`
instances in MRI's order, with `rbModInstanceMethod(...).owner` naming the class or module.

## Acceptance criteria

- [ ] `isModuleIncluded` and `includedModules` do not report a module that only the delegated class includes, with a test in `delegate.trails.test.ts`.
- [ ] `rbModAncestors` answers classes and `Module` instances rather than prototype links, and stops at a `DelegateClass`; `serializeCastValueCompatible` in `packages/activemodel/src/type/serialize-cast-value.ts` still matches MRI for the twelve built-in types.
- [ ] `pnpm parity:api:extra:gate` green.
