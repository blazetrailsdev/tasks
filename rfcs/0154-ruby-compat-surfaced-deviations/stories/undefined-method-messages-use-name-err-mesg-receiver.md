---
title: "ruby-compat: undefined-method messages use nameErrMesgReceiver for the receiver phrase"
status: draft
updated: 2026-11-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9718 added `nameErrMesgReceiver` (`packages/ruby-compat/src/object.ts`), the receiver phrase of MRI's `name_err_mesg_to_str` (`vendor/ruby/v3.3.11/error.c:2325-2390`): `nil` / `true` / `false`, `module M`, `class C`, else `an instance of C`. Other `undefined method` raises still hand-roll the phrase as `an instance of ${…constructor.name}` or `rbObjClassname`. That spelling is wrong for a nil, boolean, class or module receiver:

- `packages/ruby-compat/src/array.ts:797-798`, `:828-829` (`first` / `last`)
- `packages/ruby-compat/src/method.ts:156`
- `packages/ruby-compat/src/numeric.ts:167`
- `packages/ruby-compat/src/method-missing-proxy.ts:180`
- `packages/ruby-compat/src/include.ts:1680` (`super: no superclass method`)
- `packages/activesupport/src/delegation.ts` `generateMethodMissing` (`for an instance of ${obj.constructor.name}`)

## Acceptance criteria

- [ ] Each site above builds its receiver phrase with `nameErrMesgReceiver`.
- [ ] A test pins a class receiver's message at one converted site.
