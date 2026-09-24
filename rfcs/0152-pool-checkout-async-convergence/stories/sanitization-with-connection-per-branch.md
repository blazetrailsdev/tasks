---
title: "Sanitization: quote inside with_connection per branch, fold _sanitizeSqlArray/quoterFor"
status: ready
updated: 2026-09-24
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

Rails' `Sanitization::ClassMethods` borrows a connection per branch and does the quoting inside the
block:

- `sanitize_sql_hash_for_assignment` (`activerecord/lib/active_record/sanitization.rb:107-115`) is
  `with_connection do |c| … c.quote_table_name_for_assignment(table, attr) … c.quote(value) end`.
- `sanitize_sql_array` (`sanitization.rb:163-182`) wraps each of its three non-blank branches in
  `with_connection do |c| … end`: `replace_named_bind_variables(c, …)`, `replace_bind_variables(c, …)`,
  and `statement % values.collect { |value| c.quote_string(value.to_s) }`. The blank branch returns
  without a connection.

trails (`packages/activerecord/src/sanitization.ts`) splits this into invented helpers:
`_sanitizeSqlArray(withConnection: () => Quoter, …)` and `_sanitizeSqlHashForAssignment(quoter, …)`,
fed by `quoterFor(host)`. Since trails#8021 `quoterFor` reads
`host.connectionPool?.().withConnectionSync((c) => c)`, so the connection escapes the block, where
Rails does the work inside it. It raises `ConnectionNotDefined` itself when no quoter comes back,
which Rails leaves to `connection_pool` / `retrieve_connection_pool(strict: true)`.

The synchronous `with_connection` spelling is `connectionPool().withConnectionSync(...)`, as in
`relation.ts` and `associations/alias-tracker.ts`.

## Acceptance criteria

- `sanitizeSqlArray` / `sanitizeSqlHashForAssignment` bodies follow `sanitization.rb:107-115,163-182`:
  one `withConnectionSync((c) => …)` per Rails `with_connection`, with the quoting done inside it
  and the branches in Rails order.
- `_sanitizeSqlArray`, `_sanitizeSqlHashForAssignment` and `quoterFor` are folded into the Rails
  methods or deleted. `replace_bind_variables` / `replace_named_bind_variables` / `quote_bound_value`
  keep their Rails `(connection, …)` signatures.
- The invented `ConnectionNotDefined` raise in `quoterFor` goes. The error surfaces from the pool
  lookup, as in Rails.
- `sanitization-quoter.trails.test.ts` hosts keep passing via a `connectionPool` double, and
  `sanitize.test.ts` / `sanitize.trails.test.ts` stay green on all three adapters.
