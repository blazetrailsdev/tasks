---
title: "setupHandlerSuite is now only a reset shield; two trails-only fixture helpers overlap"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`setupHandlerSuite()` (`packages/activerecord/src/support/setup-handler-suite.ts`)
had two jobs: bootstrap `Base.connectionHandler` for the file, and push the
`skipGlobalReset` shield. PR #5415 removed the first — the worker pool is now
established once and stays up, mirroring `ARTest.connect`
(`vendor/rails/activerecord/test/support/connection.rb:31-32`) — so the helper
is now a two-line push/pop wrapper around `skip-global-reset.ts`.

That leaves two overlapping trails-only helpers with no Rails counterpart:
`setupHandlerSuite()` (holds the reset shield for a whole file) and
`useTransactionalTests()` / `withTransactionalFixtures` (wraps each test in a
rolled-back transaction and runs `resetTestAdapterState` once at scope exit).
Rails has neither: `ActiveRecord::TestCase` + `TestFixtures` load fixtures,
roll back, and `clear_active_connections!` (`test_fixtures.rb:146-158`) — there
is no per-file "shield" concept, because Rails has no global between-test table
reset to shield from.

## Acceptance criteria

- Establish whether `setupHandlerSuite` still earns its name and its own
  module now that it only manages the reset shield, or should fold into
  `skip-global-reset.ts` / the `fixtures()` surface.
- Record why the global `resetTestAdapterState` between-test reset exists at
  all given Rails has no counterpart, or file its removal as its own story —
  it is the reason both helpers exist.
- Do not change test names or the transactional-fixtures semantics; this is a
  helper-surface convergence, not a behavior change.
