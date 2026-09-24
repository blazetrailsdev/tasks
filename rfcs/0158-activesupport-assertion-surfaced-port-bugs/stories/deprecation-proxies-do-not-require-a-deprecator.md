---
title: "deprecation-proxies-do-not-require-a-deprecator"
status: ready
updated: 2026-09-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Every Rails deprecation proxy takes a required deprecator and raises
`ArgumentError` without one: `DeprecatedObjectProxy#initialize`
(`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:48`),
`DeprecatedInstanceVariableProxy#initialize` (`:82`) and
`DeprecatedConstantProxy.new` (`:117`). `deprecation_test.rb:123-127`,
`:311-315` and `:339-343` assert it.

trails' `packages/activesupport/src/deprecation/proxy-wrappers.ts` stores the
deprecator unchecked (`:58-63`, `:80-92`, `:127-134`), so construction succeeds
and the failure only surfaces later as a `TypeError` inside `warn`.

## Parked tests

`packages/activesupport/src/deprecation.test.ts`, `it.skip` with converged
bodies and a `BLOCKED: deprecation-proxies-do-not-require-a-deprecator` line:

- `DeprecatedObjectProxy requires a deprecator`
- `DeprecatedInstanceVariableProxy requires a deprecator`
- `DeprecatedConstantProxy requires a deprecator`

## Acceptance criteria

- [ ] All three constructors raise `ArgumentError` when no deprecator is given,
      at the Rails raise sites.
- [ ] The three parked tests run unskipped and green with their converged
      bodies unchanged.
