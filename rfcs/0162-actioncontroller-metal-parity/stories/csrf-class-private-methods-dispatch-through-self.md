---
title: "RequestForgeryProtection class privates dispatch through the controller class"
status: in-progress
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8639
claim: "2026-10-07T15:33:12Z"
assignee: "base-modules-members-assigned-one-by-one-not-included"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::RequestForgeryProtection::ClassMethods` defines three private
class methods, `protection_method_class`, `storage_strategy` and
`is_storage_strategy?`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:221-250`),
and `protect_from_forgery` (`:197-207`) calls the first two through `self`, as
`storage_strategy` calls `is_storage_strategy?`.

In `packages/actionpack/src/action-controller/metal/request-forgery-protection.ts`
they are module functions called bare (`protectionMethodClass(...)`,
`storageStrategy(...)`, `isStorageStrategy(name)`), so a controller class that
overrides one is not reached. trails PR 8576 converged the instance-method half
of this and left the class-method half.

## Acceptance criteria

- The three methods are extended onto the controller class with the other
  `ClassMethods` and `protectFromForgery` / `storageStrategy` call them through
  `this`.
- `protectionMethodClass` and `storageStrategy` keep Rails' `case` order and
  `ArgumentError` messages (`:221-246`).
- `pnpm parity:api:calls` stays green; both `request-forgery-protection.test.ts`
  files stay green.
