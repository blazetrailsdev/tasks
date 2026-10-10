---
title: "activerecord: StatementCache#execute's async arm (async_find_by_sql, Promise.wrap)"
status: claimed
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps:
  - record-native-promise-decision-and-retire-promise-complete-rows
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-10T09:09:37Z"
assignee: "activerecord-converge-build-where-clause-constructor-order"
blocked-by: null
closed-reason: null
---

## Context

Two reviewed rows in `call-mismatches-exclude/activerecord/statement-cache.json` on `execute`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/statement_cache.rb:149-154`): the `async: true` arm calls `@model.async_find_by_sql(...)`, and the
`rescue ::RangeError` arm returns `async ? Promise.wrap([]) : []`. trails' `execute` has no `async`
parameter. Both were seeded against `activerecord-port-promise` for `Promise.wrap`. That port was decided against on
trails#8342 and the story closed; this story now waits on
`record-native-promise-decision-and-retire-promise-complete-rows`, which records what the
native-promise shape of these two arms is.

## Acceptance criteria

- [ ] `execute(params, connection, allowRetry, async)` ports both arms; both rows deleted; the shard keeps only the second-owner `initialize → map` row owned by `converge-same-name-second-owner-call-rows`.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
