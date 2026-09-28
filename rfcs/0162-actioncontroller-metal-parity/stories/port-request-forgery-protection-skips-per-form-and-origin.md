---
title: "Port request_forgery_protection_test.rb's skipped shared-module and strategy tests"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "delete-invented-action-dispatch-respond-to-and-csrf-modules",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb`
matches all 102 tests by name, but 53 are empty `it.skip(…, () => {})` stubs in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
(e.g. `:437-446`). This story takes the first 28:

- the `RequestForgeryProtectionTests` module body (`:243-723`), which Rails
  includes into several classes: 20 skips — form and `button_to` rendering with
  and without the token tag, `remote: true` and `embed_authenticity_token_in_remote_forms`,
  and `verify_same_origin_request` for JS responses
- `RequestForgeryProtectionControllerUsingNullSessionTest` (`:739`): 2
- `PrependProtectForgeryBaseControllerTest` (`:799`): 3
- `FreeCookieControllerTest` (`:834`): 3

The file's controllers are built on the invented
`action-dispatch/request-forgery-protection.ts`
(`action-controller/base.ts` builds one as `_csrfProtection`), which
`delete-invented-action-dispatch-respond-to-and-csrf-modules` (RFC 0141)
removes; porting these bodies against it would be porting against the thing
being deleted.

## Acceptance criteria

- The 28 stubs are real tests with the Rails bodies, driven through
  `ActionController::RequestForgeryProtection`
  (`action-controller/metal/request-forgery-protection.ts`).
- The module-body tests are defined once and included into each class Rails
  includes them into.
