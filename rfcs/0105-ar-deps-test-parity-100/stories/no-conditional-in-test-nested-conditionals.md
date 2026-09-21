---
title: "no-conditional-in-test misses nested if, ternary and switch in AR test bodies"
status: closed
updated: 2026-09-21
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 40
pr: null
claim: "2026-09-21T21:24:45Z"
assignee: "fixture-set-read-fixture-files-accepts-ts-rows"
blocked-by: null
closed-reason: "Premise falsified by vendor/rails: Rails AR tests DO contain nested if/ternary conditionals — e.g. transaction_instrumentation_test.rb has 18x 'ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber' in ensure, relation/load_async_test.rb:113 'if Post.lease_connection.supports_concurrent_connections?', autosave_association_test.rb:278 'Firm.partial_updates? ? 0 : 1'. Widening the rule to every nested IfStatement/ConditionalExpression/SwitchStatement flags 95 sites in 43 files (measured), many of them faithful ports; converging them would create divergence from Rails."
---

## Context

Surfaced reviewing PR #7673 (trails), which added `eslint/no-conditional-in-test.mjs`
(`blazetrails/no-conditional-in-test`) for activerecord tests.

Like the `vitest/no-conditional-in-test` it replaced (`@vitest/eslint-plugin` 1.6.12),
it visits only an `IfStatement` whose `parent.parent.parent` is the `it`/`test` call,
i.e. an `if` sitting directly in the test body. Three shapes are never reported:

- a nested `if`, e.g. one inside `try` or `for`
- a `ConditionalExpression` (ternary)
- a `SwitchStatement`

A data-dependent conditional in any of those three shapes can therefore make a test
assert nothing without any lint signal. Rails has no such conditionals: its adapter
branches are `current_adapter?`, which the rule already exempts by shape.

## Converged shape

The rule reports every `IfStatement`, `ConditionalExpression` and `SwitchStatement`
anywhere inside a test callback. The existing whole-condition adapter exemption
(`adapterType` compared to a string literal, or `currentAdapter()`, combined with
`!`, `&&` or `||`) still applies, and nested functions defined inside the test are
still skipped.

## Acceptance criteria

- [ ] Nested `if`, ternary and `switch` in a test body report, with RuleTester cases.
- [ ] Every newly reported AR site is converged to Rails' shape rather than suppressed.
      If that is too large for one PR, the burn-down is split into follow-up stories.
