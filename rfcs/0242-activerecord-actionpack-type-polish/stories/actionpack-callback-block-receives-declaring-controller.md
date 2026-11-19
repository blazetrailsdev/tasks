---
title: "Action callback blocks receive the declaring controller's type"
status: done
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10322
claim: "2026-11-18T22:06:38Z"
assignee: "actionpack-callback-block-receives-declaring-controller"
blocked-by: null
closed-reason: null
---

## Context

Rails' `before_action { |controller| ... }` yields the controller instance the
callback runs on (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/callbacks.rb:238-262`,
`_insert_callbacks`). trails types a block callback's argument as
`AbstractController::Base`: `ActionCallback = (controller: Base) => ...`
(`packages/actionpack/lib/abstract-controller/callbacks.ts:14`, `AroundCallback`
at `:16`), and `ActionController::Base` re-declares `beforeAction` & co. as
`OmitThisParameter<typeof beforeAction>` (`packages/actionpack/lib/action-controller/base.ts`,
the `declare static beforeAction` block). So inside
`PostsController.beforeAction((controller) => controller.params)` the author
cannot read `params`, `request` or their own methods without a cast.

`packages/actionpack/dx-tests/before-action.test-d.ts` pins the current type
with a `TODO(actionpack-callback-block-receives-declaring-controller)`.

## Acceptance criteria

- [ ] A block passed to `beforeAction` / `afterAction` / `aroundAction` (and
      their prepend / append / skip forms) on a controller subclass receives
      that subclass's instance type (`InstanceType<this>`-style typing on the
      static `this`).
- [ ] The dx-test flips to `expectTypeOf(controller).toEqualTypeOf<PostsController>()`
      and the TODO is removed.
- [ ] No new `as unknown as` in actionpack `lib/`.
