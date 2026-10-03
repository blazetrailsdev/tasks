---
title: "abstract-controller: action callback macros call set_callback / skip_callback directly"
status: draft
updated: 2026-10-03
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/abstract-controller/callbacks.ts` registers action callbacks through two helpers Rails does not have, `_registerActionCallback` and `_skipActionCallback`, plus the `ActionCallbackHost` type and `_toConditionFns`. Each `beforeAction` / `prependBeforeAction` / `skipBeforeAction` (and the `after` / `around` twins) is a hand-written function that calls one of them.

Rails generates all of these in one loop, `vendor/rails/v8.0.2/actionpack/lib/abstract_controller/callbacks.rb:230-253`:

- `:231-235` `define_method "#{callback}_action"` calls `_insert_callbacks(names, blk)` and, per name, `set_callback(:process_action, callback, name, options)`.
- `:237-241` `prepend_#{callback}_action` passes `options.merge(prepend: true)`.
- `:245-249` `skip_#{callback}_action` calls `skip_callback(:process_action, callback, name, options)`.
- `:252` `alias_method :"append_#{callback}_action", :"#{callback}_action"`.

`_insert_callbacks` is `:120-127`. The helpers also rewrite a string filter to `":name"` and translate `if` / `unless` through `_toConditionFns`, neither of which the Rails bodies do. The class-method half is assigned by hand in `abstract-controller/base.ts` (`static beforeAction = beforeAction`, ...) where Rails has `module ClassMethods`.

PR trails#8461 changed only the receiver of these helpers (class, not prototype) and ported the `included do` block (`callbacks.rb:32-37`) as `Callbacks[included]`.

## Acceptance criteria

- [ ] `_registerActionCallback`, `_skipActionCallback`, `_toConditionFns` and `ActionCallbackHost` are deleted.
- [ ] Each generated macro body is `_insertCallbacks(names, blk, (name, options) => this.setCallback("process_action", callback, name, options))` (or `skipCallback`), as `callbacks.rb:231-249` has it, with the `prepend` arm passing `{ ...options, prepend: true }`.
- [ ] The macros live on `Callbacks.ClassMethods` and reach `AbstractController` through `extend()`, not hand-assigned statics.
- [ ] `append_*_action` is the alias `callbacks.rb:252` defines.
