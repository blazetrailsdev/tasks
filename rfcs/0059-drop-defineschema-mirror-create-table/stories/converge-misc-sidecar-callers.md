---
title: "Converge base/test-databases/transaction suites off sidecar _pool onto Base.connection"
status: done
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: 4512
claim: "2026-07-03T20:55:06Z"
assignee: "converge-misc-sidecar-callers"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 follow-up (see `converge-sidecar-pool-rides-canonical-schema`,
PR #4463). These remaining suites still lease from the standing sidecar
`_pool` (`packages/activerecord/src/test-adapter.ts:220 createTestAdapter`,
`:251 createSidecarTestAdapter`) on the divergent `_pooledSqliteDatabase()`
handle (`:75`) instead of `Base.connection`.

Rails: `Base.connection` everywhere; second pools built in-test from primary
config (`vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30`).

Files still calling the sidecar convenience helpers in this area:

- `base.test.ts`
- `test-databases.test.ts`
- `hot-compatibility.test.ts`
- `transaction-instrumentation.test.ts`
- `transactions.trails.test.ts`

Read each suite's Rails counterpart first.

## Acceptance criteria

- Every listed file rides `Base.connection` instead of a sidecar-leased
  adapter.
- Remove any in-test `createTable` sidecar-fallback workaround.
- No test renames; `test:compare` delta >= 0; all lanes unaffected.
- 500 LOC ceiling; single PR from main; no stacked PRs.
