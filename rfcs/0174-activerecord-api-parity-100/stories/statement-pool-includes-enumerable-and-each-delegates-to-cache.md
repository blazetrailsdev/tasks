---
title: "activerecord: StatementPool includes Enumerable and each delegates to cache.each"
status: draft
updated: 2026-10-09
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
