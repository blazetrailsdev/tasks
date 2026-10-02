---
title: "ruby-compat: rbObjDup / rbObjClone open-code the initialize_copy fallback Kernel now defines"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8408 added ruby-compat's `Kernel` module (`packages/ruby-compat/src/include.ts`), the
root `Module#superMethod` ends its search in. It defines `initializeDup` as
`vendor/ruby/v3.3.11/object.c:654` `rb_obj_init_dup_clone` does: send `initialize_copy`.

`rbObjDup` and `rbObjClone` in the same file still open-code that dispatch in `initCopyHook`:
call `initializeDup` / `initializeClone` if the object answers it, else `initializeCopy`. So
`Kernel#initialize_dup` now has two definitions, and `Kernel#initialize_clone`
(`object.c:669` `rb_obj_init_clone`, which also sends `initialize_copy`) has only the open-coded
one, so a module's `initialize_clone` that calls `super` has no root.

## Converged shape

`rb_obj_dup` (`object.c:591`) and `rb_obj_clone` send `initialize_dup` / `initialize_clone`
unconditionally; the fallback to `initialize_copy` is `Kernel`'s method, not the caller's. `Kernel`
defines `initializeClone` beside `initializeDup`, and `initCopyHook` dispatches the hook and falls
to `Kernel`'s method when the object defines none.

## Acceptance criteria

- [ ] `Kernel` defines `initializeClone`, citing `object.c`.
- [ ] `initCopyHook` holds no `initializeCopy` fallback of its own.
- [ ] `packages/ruby-compat/src/include.test.ts` (`rbObjDup`, `rbObjClone`) stays green, with a case for a module `initializeClone` that calls `super`.
