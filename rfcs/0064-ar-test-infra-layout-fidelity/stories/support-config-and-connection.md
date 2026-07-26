---
title: "support/config.ts + support/connection.ts (support/config.rb, support/connection.rb)"
status: ready
updated: 2026-07-26
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: ["move-test-helpers-to-support-dir"]
deps-rfc: []
est-loc: 400
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails splits test connection config across `test/config.rb` (the `TEST_ROOT` /
`FIXTURES_ROOT` / `SCHEMA_ROOT` path constants) and
`test/support/config.rb` (`ARTest.config`, reading `ARCONFIG` or
`test/config.yml`), with `test/support/connection.rb` owning
`ARTest.connection_name` (`ENV["ARCONN"]`), `ARTest.test_configuration_hashes`,
and `ARTest.connect`.

trails spreads the same responsibilities over invented names:
`support/test-connection-env.ts` (the `ARCONN` lane resolution — see
`test-adapter.ts:4-8`, which documents that it resolves the lane "the way Rails
does, from `ARCONN` naming a key of the `connections:` hash"),
`support/test-database-config.ts` (`buildTestDatabaseConfig`), and
`support/arunit2-config.ts`. The `establishConnection` bootstrap that matches
`ARTest.connect` currently sits in `test-setup-dy.ts:37-39`.

Spike: `docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md` (PR #5309).
Assumes `move-test-helpers-to-support-dir` has landed (paths above use
`support/`).

## Acceptance criteria

- Consolidate the config readers into `support/config.ts`, mirroring
  `support/config.rb`'s surface (`config`, `configFile`, `readConfig`) plus the
  `test/config.rb` path constants where trails needs them.
- Move the connection bootstrap into `support/connection.ts` mirroring
  `support/connection.rb` (`connectionName`, `testConfigurationHashes`,
  `connect`).
- `test-setup-dy.ts` keeps only what has no Rails counterpart (the per-worker
  `loadSchema` / `reconstructFromSchema` driver gate documented in its header)
  and calls into `support/connection.ts` for the rest.
- Method names match Rails: `ARTest.connection_name` → `connectionName`, not
  `activeLane` or another invention. Where a trails name survives because it has
  no Rails counterpart, justify it in a comment at the call site.
- If this exceeds 500 LOC, ship `support/config.ts` and register
  `support/connection.ts` as its own story.
