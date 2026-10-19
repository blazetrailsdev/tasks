---
title: "test-case-instance-assert-bumps-own-assertions"
status: ready
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
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

Rails' "child session assertions bubble up to root" (`vendor/rails/v8.0.2/actionpack/test/controller/integration_test.rb:142-148`) calls `@test.open_session.assert(true)`: Minitest's instance `assert` increments `self.assertions`, and `Integration::Runner#assertions=` (`action_dispatch/testing/integration.rb:412-419`) forwards that to the root session.

trails' `assert` (`packages/activesupport/src/testing/assertions.ts:533-541`) is a module function that bumps a module-level counter, and test instances have no `assert` method, so the port (`packages/actionpack/src/action-controller/controller/integration.test.ts:215-219`) writes `test.openSession().assertions += 1` and actioncontroller keeps one count and one kind (`truthy`) row.

## Acceptance criteria

- A test-case instance answers `assert` (Minitest's `Assertions#assert`) by bumping its own `assertions`, so a child session's assertion reaches the root through `Runner#assertions=`.
- The test calls `test.openSession().assert(true)` and `assertEqual(1, …)`, as Rails does, and actioncontroller's assertion mark reaches `{0, 0, 0}`.
