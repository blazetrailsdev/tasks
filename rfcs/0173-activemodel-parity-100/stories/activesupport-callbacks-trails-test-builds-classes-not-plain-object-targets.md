---
title: "activesupport: callbacks.trails.test.ts builds classes that include Callbacks, not plain-object targets"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activesupport-callbacks-free-target-functions-are-not-class-methods` converted the
activesupport source hosts (`execution-wrapper.ts`, `reloader.ts`,
`current-attributes.ts`, `testing/setup-and-teardown.ts`) and
`activesupport/src/callbacks.test.ts` to `include(X, Callbacks)` plus the class
methods, as `vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:691-945`
has them. It did not fit the remaining activesupport tests under the LOC ceiling.

`packages/activesupport/src/callbacks.trails.test.ts` still has ~278 calls to the
free `defineCallbacks(target, …)` / `setCallback(target, …)` / `skipCallback` /
`resetCallbacks` / `runCallbacks(target, …)`, most on a plain object
(`const target = {}`), which is the only reason `callbacksClass`'s
`rbObjSingletonClass` arm exists (`packages/activesupport/src/callbacks.ts`). It
also uses `CallbacksMixin`.

The converted shape is in `callbacks.test.ts`: a class with
`static { include(this, Callbacks); this.defineCallbacks("save"); }`, typed with
`declare static setCallback: Extended<typeof Callbacks.ClassMethods>["setCallback"]`
and `declare runCallbacks: Included<typeof Callbacks>["runCallbacks"]`, run with
`new Klass().runCallbacks("save", block)`.

## Acceptance criteria

- [ ] `callbacks.trails.test.ts` imports none of the free `defineCallbacks` / `setCallback` / `skipCallback` / `resetCallbacks` / `runCallbacks`, nor `CallbacksMixin`.
- [ ] Every test builds a class that includes `Callbacks`; test names are unchanged.
- [ ] A test that exists only to cover the plain-object singleton arm or `CallbacksMixin` is deleted with a note in the PR body.
