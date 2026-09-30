---
title: "activerecord: StatementCache#execute's async arm (async_find_by_sql, Promise.wrap)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: ["activerecord-port-promise"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two reviewed rows in `call-mismatches-exclude/activerecord/statement-cache.json` on `execute`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/statement_cache.rb:149-154`): the `async: true` arm calls `@model.async_find_by_sql(...)`, and the
`rescue ::RangeError` arm returns `async ? Promise.wrap([]) : []`. trails' `execute` has no `async`
parameter. Both depend on `activerecord-port-promise` for `Promise.wrap`.

## Acceptance criteria

- [ ] `execute(params, connection, allowRetry, async)` ports both arms; both rows deleted; the shard keeps only the second-owner `initialize → map` row owned by `converge-same-name-second-owner-call-rows`.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
