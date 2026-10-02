---
title: "activerecord: EXTENDED_TYPE_MAPS is a Concurrent::Map read through compute_if_absent"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`AbstractAdapter#type_map` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1112-1120`) is

```ruby
if key = extended_type_map_key
  self.class::EXTENDED_TYPE_MAPS.compute_if_absent(key) do
    self.class.extended_type_map(**key)
  end
else
  self.class::TYPE_MAP
end
```

over `EXTENDED_TYPE_MAPS = Concurrent::Map.new` (`abstract_adapter.rb:943`, `abstract_mysql_adapter.rb:754`, `sqlite3_adapter.rb:506`).

`packages/activerecord/src/connection-adapters/abstract-adapter.ts`'s `typeMap` keys a plain `Map<string, unknown>` by `JSON.stringify(key)` and open-codes `get` / `set`, with `@missingRailsCall compute_if_absent`. `Concurrent::Map` is a concurrent-ruby class, not a TypeScript shortcoming, and it keys by `hash` / `eql?`, which is why Rails can pass the `{ default_timezone: … }` Hash itself.

RFC 0173's `attribute-method-patterns-cache-onto-concurrent-map` ports `Concurrent::Map` into ruby-compat, and `connection-handler-pool-manager-map-onto-concurrent-map` is the `ConnectionHandler` half. This is the adapter half: land it after the port exists, or port the class here if this is picked up first.

## Acceptance criteria

- [ ] The three `EXTENDED_TYPE_MAPS` statics are `new Concurrent.Map()` (the ruby-compat port).
- [ ] `typeMap` has Rails' two arms in Rails' order, calling `computeIfAbsent(key, …)` with the key Hash itself and no `JSON.stringify`.
- [ ] The `@missingRailsCall compute_if_absent` receipt is deleted; `pnpm parity:api:calls` green with no new row.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/abstract-adapter.trails.test.ts
```
