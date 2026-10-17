---
title: "integration-runner-includes-assertions"
status: draft
updated: 2026-10-17
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

`ActionDispatch::Integration::Runner` opens with `include ActionDispatch::Assertions`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:335`).
The trails `Runner` module (`packages/actionpack/src/action-dispatch/testing/integration.ts`,
`export const Runner = new Module(...)`) omits that `mod.include(Assertions)`:
`Assertions` is a Concern, and including it into a plain (non-Concern) `Module`
runs `RoutingAssertions`' `included` block with the module as `base`, where
`assertions/routing.ts:455-457` does `Object.getPrototypeOf(this.prototype)` and
throws `TypeError: Cannot convert undefined or null to object`. Rails'
`Concern#append_features` (`activesupport/lib/active_support/concern.rb:132-143`)
runs the block on the including module, and `RoutingAssertions`' included block
(`actionpack/lib/action_dispatch/testing/assertions/routing.rb`) is class-agnostic.
`IntegrationTest` still includes `Assertions` directly, so only a standalone
includer of `Runner` misses the assertions.

## Acceptance criteria

- `Runner` calls `mod.include(Assertions)` as Rails does, and the direct
  `include(IntegrationTest, Assertions)` is dropped.
- `RoutingAssertions`' `included` hook (or Concern's module-base arm) handles a
  `Module` base without throwing.
- `runner.test.ts` (both) and the integration suites stay green.
