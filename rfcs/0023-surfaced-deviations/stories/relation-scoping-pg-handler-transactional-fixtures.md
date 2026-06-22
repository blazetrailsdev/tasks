---
title: "Pooled-pin transactional fixtures so concurrent-write scoping test runs on PG"
status: claimed
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: 150
priority: 40
pr: null
claim: "2026-06-22T15:07:57Z"
assignee: "relation-scoping-pg-handler-transactional-fixtures"
blocked-by: null
---

## Context

`packages/activerecord/src/scoping/relation-scoping.test.ts` gates
"merge inner scope has priority" on a runtime guard
(`pgConcurrentFixturesBlocked = adapterType === "postgres"`). The test does
`Promise.all` of 11 `create`s inside an outer transaction; on PG the non-pooled
BEGIN/ROLLBACK path used by withTransactionalFixtures (pool-size-1 Proxy
workaround) does not protect concurrent writes on the same `pg.Client`, causing
25P02 (transaction aborted). Needs a `withHandlerTransactionalFixtures`
(pooled-pin path compatible with the handler-resolved adapter) to run on PG.

Surfaced by RFC 0032 gate-over-gated-burndown; previously an `adapterType`
over-gate, now an incomparable runtime guard pending this convergence.

## Acceptance criteria

- [ ] Provide a pooled-pin transactional-fixtures helper that survives
      concurrent writes on PG within an outer transaction.
- [ ] Remove the `pgConcurrentFixturesBlocked` guard so the test runs on PG.
- [ ] `test:compare --package activerecord --gates` stays at 0 over-gated for
      relation-scoping.test.ts.
