---
title: "activesupport-test-case-setup-callback-chain-is-not-introspectable"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8047
claim: "2026-09-24T16:59:06Z"
assignee: "pnpm12-lockfile-package-manager-document-churn"
blocked-by: null
closed-reason: null
---

## Context

`test_case_test.rb:562-614` (`SetupAndTeardownTest` /
`SubclassSetupAndTeardownTest`) asserts
`self.class._setup_callbacks.map(&:filter)` and the teardown twin, and that the
symbol filters accumulate across a subclass. trails' `TestCase`
(`packages/activesupport/src/test-case.ts`) registers callbacks through
`setup-and-teardown.ts`, but has no per-test-class chain: `prepended` is called
once on `TestCase` itself (`test-case.ts:96`) and a `class extends TestCase` gets
no chain of its own, so `peekCallbackChain(klass, "setup")`
(`packages/activesupport/src/callbacks.ts:1097`) answers the parent's or
nothing.

## Parked tests

`packages/activesupport/src/test-case.test.ts`, `it.skip` with converged bodies
and a `BLOCKED: activesupport-test-case-setup-callback-chain-is-not-introspectable`
line:

- `SetupAndTeardownTest` › `inherited setup callbacks`
- `SubclassSetupAndTeardownTest` › `inherited setup callbacks`

## Acceptance criteria

- [ ] A `TestCase` subclass carries its own setup/teardown chain that inherits
      and extends its parent's, readable by filter name.
- [ ] Both parked tests run unskipped and green with their converged bodies
      unchanged.
