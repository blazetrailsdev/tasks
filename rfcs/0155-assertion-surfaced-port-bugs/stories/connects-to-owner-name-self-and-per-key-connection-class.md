---
title: "connects_to passes owner_name: self and sets connection_class per key (connection_handling.rb:98-105)"
status: in-progress
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8130
claim: "2026-09-26T02:17:05Z"
assignee: "mapper-drops-its-own-routes-buffer"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while inlining `establishWithDbConfig` into `establishConnection` (trails#8103).

Rails `ConnectionHandling#connects_to`
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb:98-105`):

```ruby
shards.each do |shard, database_keys|
  database_keys.each do |role, database_key|
    db_config = resolve_config_for_connection(database_key)

    self.connection_class = true
    connections << connection_handler.establish_connection(db_config, owner_name: self, role: role, shard: shard.to_sym)
  end
end
```

trails `connectsTo` (`packages/activerecord/src/connection-handling.ts`) differs:

- it sets `(this as any).connectionClass = true` once, before the loop, where
  Rails sets it per iteration right after `resolve_config_for_connection`
  (so a `resolve_config_for_connection` raise on the first key leaves
  `connection_class?` false in Rails, true in trails);
- it passes `ownerName: this.connectionClassForSelf()` where Rails passes
  `owner_name: self`. `establishConnection` now passes `this` (trails#8103);
  `connectsTo` is the remaining call site.

## Converged shape

`self.connection_class = true` inside the inner loop after
`resolveConfigForConnection`, and `ownerName: this`, both mirroring `:101-103`.

## Acceptance criteria

- `connectsTo`'s loop body matches `connection_handling.rb:99-104` line for line.
- `connection-handling.test.ts`, `connection-handlers-multi-db.test.ts`,
  `connection-handlers-sharding-db.test.ts` and `primary-class.test.ts` stay green.
