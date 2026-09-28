---
title: "Port request_forgery_protection_test.rb's skipped per-form-token and token-storage tests"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-request-forgery-protection-skips-per-form-and-origin"]
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

The other 25 empty skip stubs in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`,
against `vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb`:

- `PerFormTokensControllerTest` (`:910-1232`): 8 — per-form CSRF tokens bound
  to action and method, with query strings, trailing slashes and
  `form_with` / `button_to`
- `SkipProtectionControllerTest` (`:1234`): 2
- `SkipProtectionWhenUnprotectedControllerTest` (`:1255`): 1
- `CookieCsrfTokenStorageStrategyControllerTest` (`:1266-1420`): 13 — the
  `store: :cookie` storage strategy
- `CustomCsrfTokenStorageStrategyControllerTest` (`:1422`): 1

The call baseline `actioncontroller/metal/request-forgery-protection.json` holds
six rows on the module these exercise.

## Acceptance criteria

- The 25 stubs are real tests with Rails' bodies.
- `pnpm parity:test --package actioncontroller` reports the file 102/102 with 0
  skipped.
- Any of the six call rows that the ported tests show is a real divergence is
  converged and deleted here.
