---
title: "integration-test-app-recurses-without-override"
status: draft
updated: 2026-11-22
rfc: "0141-actionpack-surfaced-deviations"
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

`new IntegrationTest("x").get("/")` with no `app` override overflows the stack. `IntegrationTest#app`
(packages/actionpack/lib/action-dispatch/testing/integration.ts:737-739) reads
`Reflect.get(Object.getPrototypeOf(IntegrationTest.prototype), "app", this)` for Rails' `super`, but
`Runner`'s `attr_reader :app` (integration.rb:340, ported at integration.ts:584) is copied onto
`IntegrationTest.prototype` itself, so the parent prototype is the `method_missing` Proxy
(`spliceMethodMissing`, :806-830). Its trap calls `respondToMissing` → `integrationSession` → `app` again.
Rails' `Behavior#app` is `super || self.class.app` (integration.rb:693-695), and `self.class.app` falls back
to `ActionDispatch.test_app` (:676-682). Every in-repo test overrides `app`; examples/chatter's
`ApplicationIntegrationTest` does too, as a workaround.

## Acceptance criteria

- An `IntegrationTest` subclass with no `app` override drives requests against `ActionDispatch.testApp`.
- examples/chatter's `ApplicationIntegrationTest` override is deleted.
