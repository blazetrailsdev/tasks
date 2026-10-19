---
title: "http-authentication-controller-methods-are-namespaces-not-modules"
status: ready
updated: 2026-10-19
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

`ActionController::HttpAuthentication::{Basic,Digest,Token}::ControllerMethods`
are Ruby modules (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/http_authentication.rb`),
included by `Base` through `MODULES` (`base.rb:231-271`). trails writes them as
TypeScript `namespace`s in `packages/actionpack/src/action-controller/metal/http-authentication.ts`,
so they are plain objects with no classpath: `rbModName` answers `null`, and
`BaseTest#test_included_modules_are_tracked`
(`vendor/rails/v8.0.2/actionpack/test/controller/base_test.rb:350-359`), which
maps `MODULES` through `to_s`, cannot pass. It is parked `it.skip` in
`packages/actionpack/src/action-controller/controller/base.test.ts`.

## Acceptance criteria

- `HttpAuthentication`, `Basic`, `Digest`, `Token` and each `ControllerMethods`
  are ruby-compat `Module`s seated with `rbModConstSet`, so
  `rbModName(HttpAuthentication.Basic.ControllerMethods)` is
  `"ActionController::HttpAuthentication::Basic::ControllerMethods"`.
- "included modules are tracked" in `base.test.ts` is un-skipped and green.
