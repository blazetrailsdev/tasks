---
title: "rbObjClone shares the receiver's singleton class instead of cloning it"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

`rbObjClone` (`packages/ruby-compat/src/include.ts`) gives the clone the receiver's prototype as-is. When the
receiver has a singleton class (`rbObjSingletonClass`, `object.ts`), the clone therefore SHARES it.
MRI's `rb_obj_clone_setup` (`vendor/ruby/v3.3.11/object.c:461-465`) calls
`rb_singleton_class_clone_and_attach`, so the clone gets its own copy of the singleton class. So in Ruby,
`c = o.clone; c.singleton_class.define_method(:x) {}` does not give `o` an `x`. In trails it does, and
`rbObjSingletonClass(clone)` returns the original's class, whose `FL_SINGLETON` points back at the original.

trails#8290 added `rbObjDup`, which correctly skips the singleton prototype (`rb_obj_class`), and made
`rbObjClone` dispatch `initializeClone`. Neither PR touched the singleton arm.

## Converged shape

If `Object.getPrototypeOf(obj)` owns `FL_SINGLETON`, `rbObjClone` builds a fresh singleton subclass of the
same superclass for the clone, copies the singleton prototype's own members onto it, and attaches it with
`FL_SINGLETON` pointing at the clone. Then it runs `init_copy` and `initializeClone` as today.

## Acceptance criteria

- A method defined on a clone's singleton class after cloning does not reach the original, and the reverse also holds.
- `rbObjSingletonClass(clone)`'s attached object is the clone.
- `include.test.ts`'s `rbObjClone` cases stay green.
