---
title: "Route adapter-cluster tests through handler conn; delete setupAdapterSuite"
status: draft
rfc: "0011-ar-test-isolation-helper"
cluster: test-isolation-helper
deps: ["collapse-handler-txn-helper"]
deps-rfc: []
est-loc: 400
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`setupAdapterSuite` exists only because `adapters/**/*.test.ts` cluster tests
construct a raw `new PostgreSQLAdapter(...)` / `new Mysql2Adapter(...)` per file
instead of using the shared handler connection — the divergence documented in
the coverage-plan §1, which also forces the `ADAPTER_SPECIFIC_EXCLUDE` /
`TEST_ADAPTER` vitest exclusion. Routing these tests through the handler
connection lets them become ordinary `useHandlerFixtures` callers and deletes
the third helper.

See RFC 0011 §Design "End state" and §Open questions Q2.

## Acceptance criteria

- [ ] Adapter-cluster test files resolve their adapter via the shared handler
      connection (`Base.connection`) rather than constructing one directly
- [ ] Raw DDL hooks (`CREATE EXTENSION`, foreign tables, etc.) moved to a plain
      `beforeAll` that commits before the first test transaction opens
- [ ] `setupAdapterSuite` deleted; former callers use `useHandlerFixtures`
- [ ] PG and MySQL adapter dirs green; the `vitest.config.ts` adapter-collision
      comment (≈ line 17) and its exclusion no longer needed
- [ ] Shipped in ≤500-LOC batches if the file count requires it

## Notes

Q2 may surface a minority of tests that genuinely need a process-owned raw
adapter; if so, scope a thin successor rather than forcing the shared path.
Coordinate with the coverage-plan §6.2 "drop TEST_ADAPTER exclusion" decision
and RFC 0010 (adapter cleanup) — this is the test-side counterpart.
