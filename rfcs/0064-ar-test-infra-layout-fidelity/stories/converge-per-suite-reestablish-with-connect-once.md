---
title: "establishFromTestConfig exists because test-setup-dy tears the pool down"
status: in-progress
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5415
claim: "2026-07-27T14:45:07Z"
assignee: "converge-per-suite-reestablish-with-connect-once"
blocked-by: null
closed-reason: null
---

## Context

Rails connects once: `ARTest.connect` runs from `cases/helper.rb` and the pool
lives for the whole process (`vendor/rails/activerecord/test/support/connection.rb:22-38`).

trails' `test-setup-dy.ts` establishes the pool, loads the schema, then tears
the handler down again (`Base.removeConnection()`, `Base._adapter = null`) so
old-path test files do not inherit a globally-installed handler pool. Every
handler-path suite therefore re-opens the pool through
`establishFromTestConfig` (`packages/activerecord/src/support/connection.ts`),
a helper with no Rails counterpart, called from `setupHandlerSuite`,
`use-transactional-tests.ts`, `encryption/test-helpers.ts`,
`adapters/*/test-helper.ts` and a dozen test files directly.

PR #5397 narrowed the divergence — `establishFromTestConfig` now installs the same
`configurationHashes` and establishes `"arunit"` by name, so it travels
`connect`'s path — but the teardown/re-establish cycle itself remains a trails
invention, justified at the definition only as "Rails connects once from
`cases/helper.rb`".

## Acceptance criteria

- Establish why the handler must be removed after schema load — i.e. which
  "old-path" suites break when a handler pool is installed at worker start.
- Either fix those suites so the pool can stay up for the worker (Rails' model,
  which would let `establishFromTestConfig` be deleted), or document the
  vitest-specific constraint that makes it impossible and keep the helper with
  that reason recorded instead of the current one-liner.
- If the helper survives, its callers should not each re-implement the
  "connect if not connected" dance.
