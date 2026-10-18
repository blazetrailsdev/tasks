---
title: "activerecord: the pool's query-cache version is a Concurrent::AtomicFixnum, not { value: number }"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps:
  - ruby-compat-concurrent-timer-task-and-atomic-fixnum
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Operator triage 2026-10-18 (RFC 0189 refine): all parity axes at 100%; this is structural/shape fidelity with no user-observable behavior change — not worth pursuing. Closed as won't-fix."
---

## Context

`ConnectionPoolConfiguration#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:117-120`)
sets `@query_cache_version = Concurrent::AtomicFixnum.new`, `dirties_query_cache`
calls `@query_cache_version.increment` (`:182`), and the version object is handed
to `Store.new(@query_cache_version, @query_cache_max_size)` (`:189`), which reads
`.value`.

trails declares `_queryCacheVersion: { value: number }`
(`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:154`,
`connection-pool.ts:267,288`), increments it with `.value++` (`query-cache.ts:239`)
and passes it to `new Store(...)` (`:248`). No `AtomicFixnum` exists yet; the
0177 story `ruby-compat-concurrent-timer-task-and-atomic-fixnum` ports it.

## Acceptance criteria

- [ ] `_queryCacheVersion` is a ruby-compat `AtomicFixnum`, built at `connection-pool.ts:288` (the inlined `ConnectionPoolConfiguration#initialize` site).
- [ ] `dirtiesQueryCache` calls `increment()`, and `Store` reads `value` off the `AtomicFixnum`.
- [ ] `pnpm parity:api:calls` shows no omitted `increment` / `new` on `query_cache.rb`. Any baseline row this converges is deleted by hand.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/query-cache.test.ts packages/activerecord/src/query-cache.trails.test.ts
```
