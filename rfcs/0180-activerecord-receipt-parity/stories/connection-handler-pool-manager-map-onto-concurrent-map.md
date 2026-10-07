---
title: "activerecord: ConnectionHandler's pool-manager map is a Concurrent::Map with initial_capacity"
status: in-progress
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8666
claim: "2026-10-07T23:34:20Z"
assignee: "connection-handler-pool-manager-map-onto-concurrent-map"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ConnectionHandler#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:76-79`):

```ruby
def initialize
  # These caches are keyed by pool_config.connection_name (PoolConfig#connection_name).
  @connection_name_to_pool_manager = Concurrent::Map.new(initial_capacity: 2)
end
```

`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts`'s constructor builds a bare `new Map()` and carries
`@missingRailsArgs new` for the dropped `initial_capacity: 2`. `Concurrent::Map` is a concurrent-ruby
class, not a TypeScript shortcoming.

RFC 0173's `attribute-method-patterns-cache-onto-concurrent-map` ports `Concurrent::Map` into
ruby-compat for the same shape in activemodel (`attribute_methods.rb:417-419`) and names this site
in its context, but its acceptance criteria stop at activemodel. This story is the activerecord half:
land it after that one, or port the class here if this is picked up first.

## Acceptance criteria

- [ ] `ConnectionHandler`'s constructor is `new Concurrent.Map({ initialCapacity: 2 })` (the ruby-compat port), and every reader of `_connectionNameToPoolManager` (`connectionPoolNames`, `connectionPoolList`, `eachConnectionPool`, `establishConnection`, `removeConnectionPool`, `getPoolManager`, `setPoolManager`) calls what `connection_handler.rb` calls on it (`keys`, `values`, `each_value`, `[]`, `[]=`, `delete`).
- [ ] The `@missingRailsArgs new` receipt is deleted; `pnpm parity:api:calls:args` green with no new row.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activerecord/src/connection-adapters/connection-handler.test.ts
```
