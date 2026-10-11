---
title: "ruby-compat: rbObjClone and Kernel#initialize_clone drop the freeze: kwarg"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8764 gave ruby-compat's `Kernel` an `initializeClone` root
(`packages/ruby-compat/src/include.ts`, `mod.defineMethod("initializeClone", …)`)
so `ActiveRecord::Inheritance::ClassMethods#initialize_clone` can call `super`.
The root takes only `orig` and dispatches `initializeCopy`.

MRI's `rb_obj_init_clone` (`vendor/ruby/v3.3.11/object.c:663-680`, defined on
`Kernel` at `:4383` with arity -1) takes `(orig, freeze: nil)`: it validates the
kwarg through `rb_get_freeze_opt` (`:429-446`, raising `ArgumentError` for a
value that is not `true` / `false` / `nil`) before calling `initialize_copy`.
`rb_obj_clone2` (`:420-426`) and `rb_obj_clone_setup` (`:449-…`) pass `freeze:`
to `initialize_clone` only when the caller gave one, and `rbObjClone`
(`include.ts`, the `initCopyHook(clone, "initializeClone", obj)` call) takes no
`freeze` argument at all, so `obj.clone(freeze: false)` has no trails spelling
and an override's `super(orig, freeze:)` drops the kwarg.

## Acceptance criteria

- `rbObjClone(obj, { freeze })` mirrors `rb_obj_clone2`: `freeze: false` leaves
  the clone unfrozen, `freeze: true` freezes it, absent keeps the receiver's
  frozen state; a non-boolean raises `ArgumentError` with MRI's message.
- The kwarg reaches `initializeClone` only when given, as in
  `rb_obj_clone_setup`.
- `Kernel`'s `initializeClone` root takes `(orig, { freeze })` and validates it
  as `rb_obj_init_clone` does.
- Tests in ruby-compat cover the three `freeze` arms and the raise.
