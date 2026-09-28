---
title: "skip_forgery_protection is a free function, not a Base class method; trailties expands it inline"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`skip_forgery_protection(options = {})` is a class method: `skip_before_action :verify_authenticity_token, options.reverse_merge(raise: false)` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:216-218`). `Rails::WelcomeController` and `Rails::PwaController` call it by name (`railties/lib/rails/welcome_controller.rb:6`, `pwa_controller.rb:6`).

trails' `skipForgeryProtection` (`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts`) is a free function that takes the controller as a parameter. It is not `this`-typed and not seated on `ActionController::Base`. So trailties' `welcome-controller.ts` and `pwa-controller.ts` expand it by hand to `skipBeforeAction("verifyAuthenticityToken", { raise: false })`, which trails#8203 introduced. Before that, they called `skipBeforeAction` without `raise: false`.

## Acceptance criteria

- `skipForgeryProtection` is `this`-typed (`options = {}`, `reverseMerge({ raise: false })`) and is a static on `ActionController::Base`.
- The trailties welcome and PWA controllers call `skipForgeryProtection()` as Rails does.
