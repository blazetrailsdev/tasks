---
title: "Pair QueryCacheRegistry with query_cache.rb so parity:api compares it"
status: draft
updated: 2026-09-25
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

trails#8067 deleted `@missingRailsCall synchronize — PERMANENT` from
`QueryCacheRegistry#computeIfAbsent`
(`packages/activerecord/src/connection-adapters/abstract/query-cache.ts`) because
`receipt-audit.ts` reported it on an uncompared pair. The whole class is
uncompared: `scripts/api-compare/output/api-comparison.json` contains no
`QueryCacheRegistry` entry at all, so neither `parity:api` nor the call gates
see its members.

Rails: `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:97-114`
defines `ConnectionAdapters::QueryCache::QueryCacheRegistry` with `initialize`
(`@mutex = Mutex.new`, `@map = ConnectionPool::WeakThreadKeyMap.new`),
`compute_if_absent(context)` (`@map[context] || @mutex.synchronize { @map[context] ||= yield }`)
and `clear` (`@map.synchronize { @map.clear }`).

## Acceptance criteria

- `parity:api` pairs `QueryCacheRegistry` (query_cache.rb) with the TS class in
  `abstract/query-cache.ts`, so `compute_if_absent` / `clear` are scored and
  call-compared (find why the nested class is not matched — likely its nesting
  under the `QueryCache` module).
- Any call the gate then flags is converged or carries a receipt at the now-compared
  site. The TS `computeIfAbsent` body is synchronous, so the `synchronize` omission
  falls under CLAUDE.md § "The pool monitor guards only sections that span an `await`".
