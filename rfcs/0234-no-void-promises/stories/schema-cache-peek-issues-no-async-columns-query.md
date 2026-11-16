---
title: "SchemaCache sync peek stops issuing an unusable async columns query"
status: ready
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
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

## Findings from trails#10199 (reverted)

Deleting the `connection.columns` call from `SchemaReflection#getCachedColumnsHash`
reds `json-serialization.test.ts` on every adapter: `UnknownAttributeError:
unknown attribute 'name' for Contact`. Rails' `Contact`
(`vendor/rails/v8.0.2/activerecord/test/models/contact.rb`) runs on
`FakeActiveRecordAdapter`, whose `columns` answers synchronously, and gets its
schema at the first peek, the way Rails' `schema_cache.rb` `columns_hash` loads a
cold table in line. So the converged shape keeps the synchronous-adapter arm and
drops only the real adapter's unusable promise. Calling `columns` cannot tell the
two apart before it issues the query. Deciding how a real adapter is recognised
without issuing a query, or warming fake-adapter models explicitly, comes first.
