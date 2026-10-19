---
title: "Integration::Session includes Minitest::Assertions (child session assert bubbles up)"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Integration::Session` includes `Minitest::Assertions`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:94`), so a
child session answers `assert` and bumps the root test's `assertions` counter.
trails' `Session` (`packages/actionpack/src/action-dispatch/testing/integration.ts`)
has no `assert`, so `integration_test.rb:142-148` "child session assertions bubble
up to root" (`@test.open_session.assert(true)`) cannot be ported; the trails test
increments `assertions` by hand
(`packages/actionpack/src/action-controller/controller/integration.test.ts`) and
remains an assertion-count/kind mismatch row (truthy 1/0) found by
`assertion-burndown-controller-tail`.

## Acceptance criteria

- `Session` includes the Minitest assertions module, so `openSession().assert(true)`
  works and counts against the root test's `assertions`.
- The trails test is the Rails body: `test.openSession().assert(true)`, then
  `assertEqual(1, assertionsAfter - assertionsBefore)`; its parity:test:assertions
  row is gone and the actioncontroller mark is tightened.
