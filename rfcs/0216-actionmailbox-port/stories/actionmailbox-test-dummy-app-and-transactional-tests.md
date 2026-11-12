---
title: "actionmailbox tests boot their own dummy app and roll back per test"
status: claimed
updated: 2026-11-12
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-12T13:11:33Z"
assignee: "actionmailbox-test-dummy-app-and-transactional-tests"
blocked-by: null
closed-reason: null
---

## Context

Rails' actionmailbox tests boot the package's own dummy app
(`vendor/rails/v8.0.2/actionmailbox/test/test_helper.rb:7`,
`require_relative "../test/dummy/config/environment"`) and run in transactional
tests with `fixtures :all` (`:17-22`).

trails' `packages/actionmailbox/src/test-helpers/database/setup.ts` borrows
activestorage's test app (`@blazetrails/activestorage/test-helpers/database/setup`),
and `src/test-helpers/test-helper.ts` stands in for transactional rollback with a
vitest `afterEach(() => InboundEmail.destroyAll())`. The actionmailbox engine
routes are drawn on activestorage's app by `await import("../config/routes.js")`.

## Acceptance criteria

- actionmailbox has its own test dummy app (mirroring `test/dummy/config/*`) that
  mounts the engine and draws its routes.
- Each test runs inside a transaction that is rolled back, as Rails'
  `use_transactional_tests` does. The `destroyAll` `afterEach` is removed.
- Every actionmailbox test file stays green.
