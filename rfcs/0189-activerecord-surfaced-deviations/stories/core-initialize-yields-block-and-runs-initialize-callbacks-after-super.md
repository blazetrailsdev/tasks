---
title: "core-initialize-yields-block-and-runs-initialize-callbacks-after-super"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
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
closed-reason: "Delivered by trails#8774 (5d22e26ae1): base.ts:1466-1471 on origin/main calls super(attrs), then initBlock?.(this), then _runInitializeCallbacks(), Rails' Core#initialize order."
---

## Context

`ActiveRecord::Core#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-481`) ends

    super
    yield self if block_given?
    _run_initialize_callbacks

`packages/activerecord/src/core.ts`'s `constructor` now runs `init_internals`,
`initialize_internals_callback` and `super` in Rails' order (the PR that closed
`core-initialize-runs-initialize-internals-callback-after-assign-attributes`).
The block and `_run_initialize_callbacks` are still run by `Base`'s JS
constructor (`packages/activerecord/src/base.ts`), after `super(attrs)` returns.

They cannot move yet for one specific reason. `Base`'s constructor pulls every
association key (`author:`, `posts:`, `postIds:`) out of `attributes` with
`_extractAssociationAttrs` before `super`, and writes them afterwards with
`_dispatchAssociationAttrs`, through the association's synchronous writers
(`writer` / `syncWrite` / `syncIdsWrite`). Rails assigns them inside
`assign_attributes` (`activemodel/lib/active_model/attribute_assignment.rb:28-37`
→ `public_send("#{k}=", v)`), so the block and an `after_initialize` callback
see them. In trails the association writer `_assignAttributes` reaches can be
async, and leaving the keys in `attributes` raises
`assignAttributes cannot assign this attribute synchronously` — measured on
this PR: 10 tests across `belongs-to-associations.test.ts`,
`has-one-associations.test.ts` and `autosave-association.test.ts` (composite
keys, polymorphic `has_one` with touch, autosave callbacks). Moving the block
and callbacks into `Core#initialize` while the keys are deferred would run
them BEFORE the associations are assigned.

Also in the same constructor, and gone once this converges:

- `sanitizeForMassAssignment(attributes)` is called there, where Rails calls
  `sanitize_for_mass_assignment` in `assign_attributes`.
- `Base`'s four class fields (`_newRecord = true`, `_destroyed`, `_readonly`,
  `_previouslyNewRecord`) are initialized after `super()` returns, so they
  would overwrite anything a callback run inside `super` set. They become
  `declare`s: `Core#initialize` and `init_internals` already assign all four.
- `ActiveModel::Model`'s constructor calls `this.initialize(attributes)` with
  no block, so `Core#initialize`'s `block` parameter is never passed.

## Converged shape

The association writer used while `_initializingAttributes` is set is the
synchronous one, so association keys stay in `attributes` and are assigned by
`assign_attributes`. `Model`'s constructor forwards the block to `initialize`.
`Core#initialize`'s port ends `super; block; _run_initialize_callbacks`, and
`Base`'s constructor is the `Inheritance::ClassMethods#new` body followed by
`super(attributes, block)`.

## Acceptance criteria

- [ ] `_extractAssociationAttrs` and `_dispatchAssociationAttrs` are deleted;
      `new Post({ author })` assigns through `assign_attributes`.
- [ ] `Core#initialize`'s port yields the block and runs the initialize
      callbacks after `super`; `Base`'s constructor runs neither.
- [ ] `Base` has no instance field initializer for `_newRecord`, `_destroyed`,
      `_readonly` or `_previouslyNewRecord`.
- [ ] An `after_initialize` callback and the constructor block both see an
      association passed to `new`.
- [ ] `associations/*.test.ts`, `autosave-association.test.ts`,
      `callbacks.test.ts` and `base.test.ts` stay green on all three adapters.
