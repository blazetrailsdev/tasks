---
title: "beforeAction/afterAction/aroundAction accept only functions, not the method names Rails registers"
status: claimed
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-09-26T10:47:08Z"
assignee: "template-compiled-flag-is-a-container-not-a-boolean"
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. `beforeAction` / `afterAction` /
`aroundAction` accept only a function
(`packages/actionpack/src/abstract-controller/callbacks.ts:272-294`,
`callback: ActionCallback`), typed over the base `AbstractController`
(`:13-15`). Rails' idiomatic form is a method name: `before_action :require_loopback`.
`define_method "#{callback}_action" do |*names, &blk|`
(`actionpack/lib/abstract_controller/callbacks.rb:231-235`) passes each name
through `_insert_callbacks` (`:120-129`) to `set_callback`, which accepts a
Symbol naming an instance method. trails' own `skipBeforeAction` /
`skipAfterAction` / `skipAroundAction` already take `ActionCallback | string`
(`callbacks.ts:296-318`), so a callback can be skipped by a name it couldn't
have been registered under.

The cost shows up in trailmap. Its loopback guard,
`app/controllers/concerns/loopback-only.ts:61-76`, is a free function taking
`AbstractController.AbstractController`. It re-declares the request and render
shapes it needs (`LoopbackRequest`, `LoopbackGuarded`, `:3-10`) and casts
`controller as unknown as LoopbackGuarded` to reach `request` and `render`. A
Rails concern writes `before_action :require_loopback` plus a private
`require_loopback` method with no casts.

## Acceptance criteria

- `beforeAction`, `afterAction`, `aroundAction` and their `prepend*` forms
  accept one or more method names (strings) as well as functions, and register
  a name so it dispatches to the controller instance's method of that name.
  This mirrors `_insert_callbacks` / `set_callback` with a Symbol filter,
  including the `only:` / `except:` / `if:` options.
- A name registered by `beforeAction` can be removed by `skipBeforeAction` with
  the same name.
- Tests port the name-form cases from
  `actionpack/test/controller/filters_test.rb` / `abstract/callbacks_test.rb`
  that use `before_action :method`.
