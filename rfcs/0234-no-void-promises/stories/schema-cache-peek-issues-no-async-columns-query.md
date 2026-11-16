---
title: "SchemaCache sync peek stops issuing an unusable async columns query"
status: claimed
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-16T18:37:11Z"
assignee: "action-text-content-built-with-awaited-static-new"
blocked-by: null
closed-reason: null
---

## Context

`SchemaCache#getCachedColumnsHash` (`packages/activerecord/lib/connection-adapters/schema-cache.ts:~190`)
is a sync peek. It calls `connection.columns(tableName)`, which is `async` on
every real adapter (`abstract/schema-statements.ts:750`). The peek then
discards the promise and, since trails#10157, reports its rejection through
`ActiveSupport.errorReporter`. So every peek miss issues a query whose result
can never be used, and a missing table reports a handled error. Rails
`schema_cache.rb` `columns_hash` reads only the cache.

## Acceptance criteria

- [ ] A cold peek issues no query, and only a warm cache answers it.
- [ ] No `errorReporter` report from the peek path.
- [ ] model-schema sync-load trails tests stay green.
