---
title: "NullPool's get trap raises for every non-member send; delete NULL_POOL_UNDEFINED_METHODS"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6251
claim: "2026-08-08T17:51:58Z"
assignee: "dt-new-by-frags-offset-truncates-to-int"
blocked-by: null
closed-reason: null
---

## Context

`NullPool`'s `get` trap raises `NoMethodError` only for the two names in
`NULL_POOL_UNDEFINED_METHODS` (`connection-adapters/abstract/connection-pool.ts:115`,
consulted at `:161`), a narrowing introduced by #6240 because raising on every
member Ruby's `NullPool` lacks reddened suites that reached
`clearQueryCache` through its duck-typed `this.pool?.clearQueryCache` reader.

That reader is gone: #6242 converged `clearQueryCache` to Rails' bare
`pool.clear_query_cache` (`activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:232-234`)
and moved every pool-less call site onto a real `ConnectionPool` via
`support/pooled-sqlite-adapter.ts`. The blocker the allowlist was created for no
longer exists.

Ruby has no allowlist: `NullPool` (`abstract/connection_pool.rb:24-48`) defines a
short fixed set of methods and `method_missing` is not overridden, so _every_
other send raises `NoMethodError`. The set is the deviation.

## Converged shape

- Delete `NULL_POOL_UNDEFINED_METHODS`.
- The `get` trap raises for every non-member **string** key (symbol keys keep
  returning `undefined` — that is the JS-only probe path, not a Ruby send).
- Fix whatever the widened trap surfaces by giving the caller a real pool or by
  removing the send, never by re-adding names to a set.

## Acceptance criteria

- [ ] `NULL_POOL_UNDEFINED_METHODS` no longer exists.
- [ ] `NullPool` raises `NoMethodError` for every non-member string key.
- [ ] No new baseline rows or allowlist entries added to accommodate it.
