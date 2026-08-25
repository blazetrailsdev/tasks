---
title: "Disambiguate same-name members in the call comparator (query_cache homonym)"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6379
claim: "2026-08-11T21:26:07Z"
assignee: "burndown-order-only-rows-associations-remainder"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `audit-constructor-idiom-cluster-reasons` (PR #6374), which
line-diffed the seven "constructor idiom" rows. Six were real port gaps; the
seventh is a **matcher** bug and is now baselined with a reason describing it
rather than a fix.

`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb`
declares the name `query_cache` twice:

- `ConnectionPoolConfiguration#query_cache` (`:187-191`) —
  `@thread_query_caches.compute_if_absent(...) { Store.new(...) }`
- the adapter's `attr_accessor :query_cache` (`:194`) — a plain reader

trails has both counterparts, in one file:

- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts:305-309`
  — `get queryCache(): Store`, which DOES call `computeIfAbsent` and
  `new Store(...)`
- `query-cache.ts:330-332` — `export function queryCache(this: QueryCacheHost)`,
  the attr-reader port

The comparator matches on `package + tsFile + rubyName` with **no class/owner
discriminator**, so it pairs the Rails `:187` body against the attr-reader at
`:330` and reports both calls missing. Nothing is missing from the port. The
row is pure tooling noise and it cost a full audit cycle to diagnose.

This is the same class my notes call "call-gate names with Relation homonyms":
wherever one Ruby file declares a name twice and trails ports both, the
comparator can pair the wrong two.

## Acceptance criteria

- The call comparator disambiguates same-name members by owner (Ruby
  class/module vs TS class / top-level function), so the
  `ConnectionPoolConfiguration#query_cache` body pairs with the `queryCache`
  getter, and the `attr_accessor` pairs with the top-level `queryCache`
  function.
- Survey the artifact for other homonym mispairings the fix resolves; rows that
  evaporate are DELETED from `call-mismatches-exclude/` by hand
  (only-shrink, `serializeBaseline`, no `--write` reseed).
- The `query_cache` row in
  `scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/query-cache.json`
  is deleted, not re-reasoned.
- `parity:api:calls` green with zero STALE; `parity:api` totals do not regress.
