---
title: "activerecord: StatementPool includes Enumerable and each delegates to cache.each"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::ConnectionAdapters::StatementPool`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/statement_pool.rb:5-18`) is

```ruby
class StatementPool # :nodoc:
  include Enumerable
  ...
  def each(&block)
    cache.each(&block)
  end
```

`packages/activerecord/src/connection-adapters/statement-pool.ts` has no `include(StatementPool,
Enumerable)`, and `each` is a hand-written `for (const [key, stmt] of this.cache) fn(key, stmt)`
whose parameter is `fn`, not `block`. Since trails#8716 the per-pid cache is a ruby-compat `Hash`,
which has `each`, so the body can be Rails' one line.

`packages/activerecord/src/fixture-set/file.ts` shows the settled shape for `include Enumerable`
(the class / interface merge plus `include(File, Enumerable)`).

## Acceptance criteria

- [ ] `StatementPool` includes `Enumerable`, and `each(block)` is `this.cache.each(block)`.
- [ ] Callers and tests that pass a two-argument block still work, or are updated to the pair
      shape `Hash#each` yields.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:params` and `pnpm parity:api:extra:gate` stay green.

## Notes

RFC `0190-native-js-hash-forms` open question 4 (resolved 2026-10-10) makes the
per-pid cache a plain object again, as Rails' `{}` is
(`native-hash-statement-pool-cache-is-a-plain-object`). `each(block)` as
`this.cache.each(block)` holds only while the cache is a ruby-compat `Hash`.
If that story has landed first, `each` is a `for…of` over
`Object.entries(this.cache)` and the first criterion's second half no longer
applies; `include(StatementPool, Enumerable)` is unaffected.
