---
title: "relation-quoting-via-adapter-class-not-connection"
status: draft
updated: 2026-09-23
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`connectionFor` (`packages/activerecord/src/relation/query-methods.ts:1894-1896`) is a trails-only helper:
`connectionPool.call(modelClass).activeConnection ?? modelClass.connection`. It is called at
`query-methods.ts:1443, 1904, 1937, 1976, 2007, 2035` to quote table and column names while
building Arel.

Rails does not reach a connection at those sites. It quotes through the adapter class:
`model.adapter_class.quote_table_name` (`relation/query_methods.rb:1986, 2005, 2011, 2158`),
`model.adapter_class.quote_column_name` (`:2241, 2249`), and
`model.adapter_class.column_name_with_order_matcher` (`:718, 2084`).

Since trails#8007 retired `leaseConnectionSync`, `ConnectionHandling#connection` answers only a
connection already on the lease and raises `ConnectionNotEstablished` otherwise (RFC 0152 Open
question 1). So with the default `permanent_connection_checkout = true`, building an `order` /
`select` / `pluck` relation with nothing leased now raises from `connectionFor`'s fallback,
where it used to check a connection out synchronously. Under `:disallowed` (the AR suite,
`cases/helper.ts`) that fallback already raised `ActiveRecordError`.

`adapterClassSync` (`connection-handling.ts:364`) already resolves the adapter class
synchronously once the adapter is loaded.

## Acceptance criteria

- Every `connectionFor` call site quotes through the model's adapter class, as the cited Rails
  lines do, and `connectionFor` is deleted.
- Building an `order` / `select` Arel with nothing leased, under
  `permanent_connection_checkout = true`, does not raise; a trails-only test pins that.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green, with any row this
  convergence makes stale deleted by hand.
