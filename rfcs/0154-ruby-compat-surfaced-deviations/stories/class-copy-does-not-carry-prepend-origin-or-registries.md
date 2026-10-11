---
title: "ruby-compat: a cloned class does not carry its prepend origin or its own copies of the include registries"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
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

trails#8785 made `rbObjClone` / `rbObjDup` copy a class constructor
(`packages/ruby-compat/src/include.ts`, `classAlloc` + `copyMethodTable`), mirroring
`rb_mod_init_copy` (`vendor/ruby/v3.3.11/class.c:524-600`). MRI copies everything hanging off the
class: the ivar and constant tables (`copy_tables`, `:547`), the method table (`:548-554`), and the
prepend origin chain (`:562-620`).

The port copies own property descriptors of the constructor and of its `prototype`, and clones the
`includedModules` set. State ruby-compat keeps OUTSIDE the object is not carried to the copy:

- `prependOrigins` (a `WeakMap` keyed by the prototype, `include.ts`): a class with a prepended
  module is copied without its origin, so `superMethod` from the prepended module on the copy has
  no origin to resume at, where MRI rebuilds the origin chain for the clone.
- `extendedOwners` is carried for the constructor only; the instance-initializer registries on the
  prototype are shared arrays, not copies, so a later `include` on the copy also registers on the
  original.
- `classpaths` is correctly not carried (a clone is anonymous).

Callers keep their own class-keyed `WeakMap`s too (ActiveRecord's `@__reflections` in
`reflection.ts`), which Ruby would copy as ivars.

## Converged shape

A copied class has its own prepend origin and its own copies of every registry MRI's
`rb_mod_init_copy` would copy, so mutating the copy never reaches the original and `super` from a
prepended module resolves on the copy.

## Acceptance criteria

- [ ] A test clones a class that has a prepended module and calls a method whose module body calls `superMethod`; it resolves on the copy.
- [ ] A test includes a module into the copy and asserts the original's ancestry and instance initializers are unchanged.
- [ ] Each registry is either copied or listed in the JSDoc of `rbObjClone` as not carried, with the MRI line it corresponds to.
