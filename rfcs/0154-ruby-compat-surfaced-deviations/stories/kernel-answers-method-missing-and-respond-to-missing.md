---
title: "Kernel lacks method_missing / respond_to_missing?, so ports hand-build the terminal super arm"
status: draft
updated: 2026-11-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `super` from a `method_missing` / `respond_to_missing?` ends at
`BasicObject#method_missing` (`rb_method_missing`, `vendor/ruby/v3.3.11/vm_eval.c:945`,
defined at `:2570`) and `Kernel#respond_to_missing?` (`obj_respond_to_missing`,
`vendor/ruby/v3.3.11/vm_method.c:3009`, defined at `:3018`). ruby-compat's `Kernel`
(`packages/ruby-compat/lib/include.ts`, `export const Kernel`) has neither, and
`rbCallSuper` falls back only to `Kernel`. So every port open-codes the terminal arm:

- `packages/actionpack/lib/abstract-controller/collector.ts` `methodMissing`:
  `superMethod(...)`, then a hand-built `NoMethodError("undefined method '…' for an instance of …")`.
- `packages/actionpack/lib/action-dispatch/testing/integration.ts` `Runner` `methodMissing` (same),
  and `respondToMissing` with `superMethod(...)?.(…) === true` standing in for the `false` default.
- `packages/actionpack/lib/action-dispatch/testing/assertions/routing.ts` `methodMissing` (same).

## Converged shape

`Kernel.methodMissing(mid, ...args)` raises the `NoMethodError` `rb_method_missing` raises,
and `Kernel.respondToMissing(mid, priv)` answers `false`. Each call site's `super` then
returns the super call directly, with no hand-built raise and no optional call.
trails#10358 prototyped both (reverted with that PR's RoutingAssertions conversion).

## Acceptance criteria

- `Kernel` answers `methodMissing` and `respondToMissing` with the MRI behaviour above.
- The three sites above drop their hand-built `NoMethodError` and optional-call fallbacks.
- Existing tests for collector, integration and routing `method_missing` stay green.
