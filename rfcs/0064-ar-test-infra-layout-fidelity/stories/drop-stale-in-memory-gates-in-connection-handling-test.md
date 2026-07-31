---
title: "Drop the stale skipIf(inMemoryDb()) gates in connection-handling.test.ts"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5697
claim: "2026-07-31T01:24:03Z"
assignee: "drop-stale-in-memory-gates-in-connection-handling-test"
blocked-by: null
closed-reason: null
---

## Context

`connection-handling.test.ts` still carries ten `it.skipIf(inMemoryDb())`
gates on the `#with_connection` / `#lease_connection` / `#connection` cases
(`packages/activerecord/src/connection-handling.test.ts:53-214` on merged
main). They predate PR #5692, which moved `restoreWorkerConnection` into
`support/connection.ts` and made it re-lay the canonical schema when the
worker database comes back empty.

Measured on merged main: deleting every remaining `skipIf(inMemoryDb())` in
that file (and the now-unused `inMemoryDb` import) leaves
`ARCONN=sqlite3_mem npx vitest run packages/activerecord/src/connection-handling.test.ts`
green — 56/56 passing, zero skipped. The gates are stale coverage loss, not
a live hazard.

Rails has no counterpart to these gates at all: `in_memory_db?`
(`vendor/rails/activerecord/test/support/adapter_helper.rb`) gates cases that
cannot work against `:memory:`, and these lease/release cases are not among
them.

## Acceptance criteria

- The remaining `it.skipIf(inMemoryDb())` gates in
  `connection-handling.test.ts` are dropped (keep any that a re-measurement
  shows genuinely fails on the mem lane, with the reason recorded at the call
  site).
- The `inMemoryDb` import goes if no case in the file still uses it.
- `ARCONN=sqlite3_mem` stays green for the file and for a sibling file
  sharing the same worker.
- Test names are untouched.
