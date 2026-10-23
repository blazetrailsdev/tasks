---
title: "rb-obj-class-answers-module-for-plain-object-modules"
status: draft
updated: 2026-10-23
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjIsKindOf` (`packages/ruby-compat/src/include.ts`, `rbObjIsKindOf`) answers `Module` as the class of a module-marked plain object (one with a classpath or a `moduleVisibility` stamp), per MRI `rb_obj_is_kind_of` (`vendor/ruby/v3.3.11/object.c`). `rbObjClass` (`packages/ruby-compat/src/object.ts:91`) still answers `Hash` for the same object through `isPlainHash`, so `obj.class` and `is_a?` disagree. `object.ts` cannot import `Module` from `include.ts` without an import cycle (`include.ts` imports `object.ts`). Surfaced on trails#9277.

## Acceptance criteria

- `rbObjClass` answers `Module` (`rbCModule`) for a plain object that `rbObjIsKindOf` treats as a module, as `rb_obj_class` does (`vendor/ruby/v3.3.11/object.c:296`).
- `rbObjIsKindOf`'s local `isModuleObject` arm folds into `rbObjClass`.
- A ruby-compat test covers `rbObjClass(defineModule({}))`.
