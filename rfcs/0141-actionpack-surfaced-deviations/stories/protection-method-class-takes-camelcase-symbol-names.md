---
title: "protection-method-class-takes-camelcase-symbol-names"
status: draft
updated: 2026-11-26
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

`protectionMethodClass` in `packages/actionpack/lib/action-controller/metal/request-forgery-protection.ts:701-720` takes `ProtectionMethodName = "null_session" | "reset_session" | "exception"`. That mirrors Rails' Symbols `:null_session` / `:reset_session` / `:exception` (`vendor/rails/v8.0.5.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb`, `protection_method_class`). By root CLAUDE.md "Casing is translated, never mirrored", a Symbol option value is camelCased: `protectFromForgery({ with: "resetSession" })`, `"nullSession"`. Callers today, including `packages/trailties/test/application/configuration.test.ts` ("config.action_controller.wrap_parameters is set in ActionController::Base"), have to write the snake form. The `ArgumentError` message keeps Rails' text.

## Acceptance criteria

- [ ] `protectionMethodClass` accepts `"nullSession"`, `"resetSession"` and `"exception"`, and `ProtectionMethodName` is narrowed to those.
- [ ] Every caller in the repo, tests included, is converted to the camelCase spelling.
