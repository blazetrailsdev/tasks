---
title: "Converge column/type suites off sidecar _pool onto Base.connection"
status: claimed
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-07-03T20:54:46Z"
assignee: "converge-column-type-sidecar-callers"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 follow-up (see `converge-sidecar-pool-rides-canonical-schema`,
PR #4463). Column/type-oriented suites still lease from the standing sidecar
`_pool` via `createTestAdapter`
(`packages/activerecord/src/test-adapter.ts:220`), backed by
`_establishPooledTestPool` (`:116`) on the divergent
`_pooledSqliteDatabase()` handle (`:75`) — NOT `Base.connection`.

Rails uses `Base.connection` everywhere
(`vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30` shows the
only sanctioned way to build a second pool: in-test from the primary config).

Files still calling `createTestAdapter` in this area:

- `cache-key.test.ts`
- `comment.test.ts`
- `defaults.test.ts`
- `date-time-precision.test.ts`
- `time-precision.test.ts`
- `ordered-options.test.ts`

Read each suite's Rails counterpart first.

## Acceptance criteria

- Every listed file rides `Base.connection` instead of a sidecar-leased
  adapter.
- Remove any in-test `createTable` workaround that only existed for the
  schemaless sidecar fallback.
- No test renames; `test:compare` delta >= 0; all lanes unaffected.
- 500 LOC ceiling; single PR from main; no stacked PRs.
