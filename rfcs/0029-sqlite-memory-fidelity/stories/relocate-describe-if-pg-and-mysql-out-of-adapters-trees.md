---
title: "Relocate describeIfPg/describeIfMysql out of the adapter test-helper trees"
status: in-progress
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 45
priority: null
pr: 5540
claim: "2026-07-28T22:25:43Z"
assignee: "relocate-describe-if-pg-and-mysql-out-of-adapters-trees"
blocked-by: null
closed-reason: null
---

## Context

PR #5536 (story `relocate-describe-if-sqlite-out-of-adapters-tree`) moved `describeIfSqlite` to `packages/activerecord/src/support/describe-if-sqlite.ts` so `connection-adapters/` tests stop importing test glue from `adapters/sqlite3/`. Its PG and MySQL counterparts still have the exact same problem and were out of scope for that PR:

- `describeIfPg` is defined in `packages/activerecord/src/adapters/postgresql/test-helper.ts` and imported cross-tree by `packages/activerecord/src/defaults.test.ts:21`.
- `describeIfMysql` is defined in `packages/activerecord/src/adapters/abstract-mysql-adapter/test-helper.ts` and imported cross-tree by `packages/activerecord/src/invalid-connection.test.ts:3` and `packages/activerecord/src/defaults.test.ts:16`.

Both adapter test-helper files carry the same "helpers for this tree only" framing the sqlite one did, so the contract is false for them too. `packages/activerecord/src/support/supports.ts` already documents all three as a set.

`scripts/test-compare/gates.ts` recognizes these wrappers by name, not import path, so relocation does not move the test:compare gate delta (verified for `describeIfSqlite` in #5536).

## Acceptance criteria

- [ ] `describeIfPg` and `describeIfMysql` live in tree-neutral `support/` modules alongside `describe-if-sqlite.ts`.
- [ ] Every importer repointed; no test file imports a gate from another adapter tree.
- [ ] Each adapter `test-helper.ts` docstring matches what it still holds.
- [ ] One definition per predicate — no duplicated gate.
- [ ] Test names unchanged; api:compare and test:compare deltas non-negative.
