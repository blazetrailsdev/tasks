---
title: "advisory-lock-exit-handlers-await-their-release"
status: draft
updated: 2026-11-21
rfc: "0189-activerecord-surfaced-deviations"
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

# Advisory-lock exit handlers release their connection where it can settle

## Context

`packages/activerecord/test/support/test-setup-worker-db.ts:59` and `:99` release the PG / MySQL advisory-lock connection in `process.on("exit")` as `client.end().catch((error) => { throw error; })`. An `exit` listener cannot await, so `end()` never settles before the process exits, and a re-throw inside `.catch` only turns into a fresh unhandled rejection. Raised in review of trails#10430.

## Acceptance criteria

- The cleanup runs where it can be awaited (`beforeExit`, or the worker teardown hook), and `end()` is awaited.
- A failure is logged or re-raised to a real handler, not re-thrown inside `.catch`.
- `pnpm parity:promises` stays at or below its marks for activerecord.
