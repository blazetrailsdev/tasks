---
title: "verify_authenticity_token and its private siblings are private on ActionController::Base"
status: draft
updated: 2026-10-05
rfc: "0162-actioncontroller-metal-parity"
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

`ActionController::RequestForgeryProtection#verify_authenticity_token`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:391`)
sits under the module's `private` (`:381`). trails declares it public on `Base`
(`packages/actionpack/src/action-controller/base.ts:329`, body at
`action-controller/metal/request-forgery-protection.ts:398`).

Consequence found in trails#8515: `PrependProtectForgeryBaseController`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:132-144`)
overrides it under `private`, and the port in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
has to leave the override public: TS2415 rejects narrowing a public base member.

## Acceptance criteria

- `verifyAuthenticityToken` is `protected` (or `private`) plus `@internal` on
  the controller surface, per CLAUDE.md § "Method visibility is compile-time
  only", along with the other members under `request_forgery_protection.rb:381`.
- The test controller's override carries the same keyword.
