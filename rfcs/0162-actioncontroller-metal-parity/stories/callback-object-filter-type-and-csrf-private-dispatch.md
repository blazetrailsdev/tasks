---
title: "Type callback-object filters; dispatch CSRF private methods through this"
status: in-progress
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8576
claim: "2026-10-06T14:01:14Z"
assignee: "callback-object-filter-type-and-csrf-private-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Two gaps surfaced while porting `filters_test.rb` and `PerFormTokensControllerTest` (trails PR 8510):

- `packages/actionpack/src/abstract-controller/callbacks.ts` types a filter as
  `CallbackFilter = ActionCallback | AroundCallback | string`. Rails' `before_action` /
  `around_action` also take an object answering `before` / `after` / `around`
  (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/callbacks.rb:117-132`;
  exercised by `AroundFilter.new`, `AuditFilter`, `YieldingFilter` at
  `vendor/rails/v8.0.2/actionpack/test/controller/filters_test.rb:341-399,915-935`). The
  runtime already dispatches them through `CallTemplate::ObjectCall`, but the type rejects
  them, so `filters.test.ts` passes each one `as never`.
- `packages/actionpack/src/action-controller/metal/request-forgery-protection.ts` reaches
  its private methods as module functions (`perFormCsrfToken.call(this, …)`,
  `compareWithGlobalToken.call(this, …)`, `maskedAuthenticityToken.call(this, …)`), where
  Rails dispatches each through `self`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:469-600`).
  Only `valid_authenticity_token?` and the five methods the per-form tests `send` are
  included on the controller, so a subclass override of any other is not reached.

## Acceptance criteria

- `CallbackFilter` admits a callback object, and the `as never` casts in
  `packages/actionpack/src/action-controller/controller/filters.test.ts` are removed.
- Every private method of `ActionController::RequestForgeryProtection` is included on the
  controller and called through `this`.
