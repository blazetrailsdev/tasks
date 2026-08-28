---
title: "rehome-store-accessors-module-and-local-stored-attributes"
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
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

`ActiveRecord::Store::ClassMethods#_store_accessors_module`
(`vendor/rails/activerecord/lib/active_record/store.rb:145-153`) is a class
method, and `local_stored_attributes` is a `class << self; attr_accessor` the
`included do` block installs (`store.rb:96-100`). Both read `self`.

trails keeps three free functions taking the model class first
(`packages/activerecord/src/store.ts`):

- `storeAccessorsModule(modelClass)` (:99), re-exported at the bottom of the
  file as `_storeAccessorsModule` (:466) — two public names for one Ruby method.
- `localStoredAttributes(modelClass)` (:111), plus a second
  `localStoredAttributesMethod(this)` wrapper (:122) that exists only to be
  `extend()`ed onto `Base` — the wrapper is the shape `store` /
  `storeAccessor` no longer need now that they are class methods.

`rehome-store-and-store-accessor-as-class-methods` (PR #7187) converged the two
macros in this file and left these three behind: they are called from inside the
macro bodies, so the argument they take is invisible to a Rails reader of
`store.rb` and `parity:api:calls:args` sees a different argument list at each
call.

## Converged shape

`_storeAccessorsModule` joins the `ClassMethods` object PR #7187 added and is
`this`-typed. `localStoredAttributes` collapses to the single `this`-typed
reader already wired at the store.rb:96-100 seat, and the
`localStoredAttributesMethod` wrapper and the `_storeAccessorsModule` alias
export both go away. `store` / `storeAccessor` call them as `this.…`.

## Acceptance criteria

- [ ] `storeAccessorsModule` / `localStoredAttributes` are `this`-typed, with no
      `modelClass` first parameter and no second wrapper or alias export.
- [ ] `index.ts` and `base.ts` reach them through the class, not the free
      function.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel names;
      `parity:api:calls:args` delta non-negative; activerecord suite green on
      all three lanes.
