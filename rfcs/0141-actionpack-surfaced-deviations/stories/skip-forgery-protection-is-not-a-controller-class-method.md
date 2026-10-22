---
title: "trailties' welcome and PWA controllers expand skip_forgery_protection by hand"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`skip_forgery_protection(options = {})` is a class method:
`skip_before_action :verify_authenticity_token, options.reverse_merge(raise: false)`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:216-218`).
`Rails::WelcomeController` and `Rails::PwaController` call it by name
(`railties/lib/rails/welcome_controller.rb:6`, `pwa_controller.rb:6`).

trails' `skipForgeryProtection` is now `this`-typed
(`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:322`) and
declared as a static on `ActionController::Base` (`action-controller/base.ts:538`). The
trailties callers still expand it by hand, as trails#8203 wrote them:
`packages/trailties/src/welcome-controller.ts:16` and `pwa-controller.ts:20` call
`skipBeforeAction("verifyAuthenticityToken", { raise: false })`.

## Acceptance criteria

- `WelcomeController` and `PWAController` call `skipForgeryProtection()` as Rails does.
- A trailties test (or the existing welcome / PWA controller tests) shows a request without an
  authenticity token reaching the action.
