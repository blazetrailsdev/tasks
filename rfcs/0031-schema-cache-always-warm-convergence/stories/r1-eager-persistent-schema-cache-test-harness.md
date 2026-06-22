---
title: "R1: eager-warm + persistent per-test schema cache in the AR test harness"
status: in-progress
updated: 2026-06-22
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: 3856
claim: "2026-06-21T22:30:43Z"
assignee: "r1-eager-persistent-schema-cache-test-harness"
blocked-by: null
---

## Context

RFC `0031-schema-cache-always-warm-convergence` phase R1. trails' sync
`columnsHash()` cannot reflect a cold table (async drivers), so the AR test
harness blanket-clears the per-connection `SchemaCache` every teardown
(`packages/activerecord/src/test-helpers/with-transactional-fixtures.ts`
`clearSchemaCache`). This is the non-Rails behavior that forces the synthesize +
sibling-borrow workarounds and diverges from Rails' persistent, pool-scoped
schema cache (`schema_cache.rb`; teardown clears per-table only via
`clear_data_source_cache!`).

This story establishes the **always-warm + persistent** cache posture WITHOUT
removing synthesize or borrow yet, so it can land green on its own.

Primitives already present: `SchemaReflection.eagerLoadSchemaCache`,
`SchemaReflection#loadAllBang`, `SchemaCache#addAll`
(`packages/activerecord/src/connection-adapters/schema-cache.ts`).

## Scope

- Eagerly warm the schema cache (all tables) once after suite/connection schema
  setup so sync reads are served warm.
- Replace the blanket teardown `schemaCache.clear()` with per-table re-warm/clear
  of only the tables a test's DDL touched (the `clear_data_source_cache!` shape),
  so unchanged-table entries persist across tests.
- Keep the synthesize-from-attributes fallback and `borrowSameTableColumns`
  in place (removed in R2/R3). The suite must stay green.

## Acceptance criteria

- [ ] The AR test harness pre-warms the per-connection `SchemaCache` for all
      tables after schema setup; a sync `columnsHash()` on a connected,
      table-backed model reads warm DB columns without a prior await.
- [ ] `withTransactionalFixtures` teardown no longer blanket-clears; only
      DDL-touched tables are re-reflected, unchanged entries survive.
- [ ] Full AR suite green on SQLite canonical; PG/MySQL per gate. Synthesize and
      borrow remain unchanged in this story.

## Hard rules

- No `node:*` imports, no `process.*`, async fs only, no new runtime deps.
- Conventional commits, draft PR, run /link after open.
