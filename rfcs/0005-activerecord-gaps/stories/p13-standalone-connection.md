---
title: "P13 — implement StandaloneConnection class"
status: closed
updated: 2026-07-27
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Mis-specified: no StandaloneConnection class exists in Rails (the name is only the test class StandaloneConnectionTest); the tested surface (DatabaseConfig#new_connection, AbstractAdapter#throw_away!/#close/#active?) is already ported (database-config.ts newConnection, abstract-adapter.ts throwAwayBang), and standalone-connection.test.ts was un-stubbed by 0030/nested-error-standalone-connection-skips (3 tests live, async-fallback recorded permanent-skip pending FutureResult/load_async). Vendor-refresh blocker was unsatisfiable."
---

## Context

`StandaloneConnection` wraps a raw connection with `throwAway!` / `close`
semantics. The class is absent from the current vendored Rails snapshot, so the
port is blocked until a Rails source refresh.

## Acceptance criteria

- [ ] `connection-adapters/standalone-connection.ts` created with
      `throwAway!` / `close` semantics matching refreshed Rails source
- [ ] 4 skipped tests unskipped and green

## Notes

From the connection-pool gap plan (P13). Blocked on Rails vendor refresh.
