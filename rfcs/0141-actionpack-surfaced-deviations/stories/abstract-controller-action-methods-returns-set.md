---
title: "AbstractController.action_methods returns a Set"
status: ready
updated: 2026-10-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Base.action_methods` returns a `Set`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:84-97`, `Set.new(methods.reject…)`).
trails' `AbstractController.actionMethods()` (`packages/actionpack/src/abstract-controller/base.ts:197`)
returns `string[]` copied from a Set cache, so `actionview/test/actionpack/abstract/abstract_controller_test.rb`'s
`assert_equal Set.new(["index"]), Me6.action_methods` is ported as `new Set(Me6.actionMethods())`.

## Acceptance criteria

- `actionMethods()` returns the `Set` (frozen as Rails' `.freeze`), and callers use `has` where they used `includes`.
- `abstract-controller.test.ts` (actionview) asserts `Me6.actionMethods()` equals `new Set(["index"])` directly.
