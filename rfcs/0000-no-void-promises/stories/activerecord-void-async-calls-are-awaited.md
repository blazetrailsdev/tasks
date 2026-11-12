---
title: "ActiveRecord: every voided async call is awaited up its call chain"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: []
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 3. `connection-adapters/statement-pool.ts:47,55,67`
(`void this.dealloc`, async on PostgreSQL, `postgresql-adapter.ts:2035`),
`associations/collection-association.ts:52` (`void this.replaceOnTarget`),
`relation/batches.ts:214`, `relation/delegation.ts:126`,
`connection-adapters/mysql2-adapter.ts:186`,
`connection-adapters/schema-cache.ts:195`,
`connection-adapters/abstract/connection-pool.ts:786`,
`test-helpers/migration-helper.ts:73`, `test-helpers/models/bird.ts:35`,
`cases/json-shared-test-cases.ts:40`.

## Acceptance criteria

- [ ] Each site awaits or returns its promise; the enclosing methods become async up to the first already-async caller.
- [ ] A failing `dealloc` on PostgreSQL propagates (a regression test that fails on the baseline).
- [ ] activerecord's mark for both rules is tightened.
