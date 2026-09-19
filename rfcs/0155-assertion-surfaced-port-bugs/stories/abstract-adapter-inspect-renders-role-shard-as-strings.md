---
title: "AbstractAdapter#inspect renders role/shard as strings, Rails renders Symbols"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7885. Rails renders Symbol values via `inspect` (`:writing`, `:shard_one`). `ConnectionPool#inspect` now does this (`connection_pool.rb:278`, `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:301`), but `AbstractAdapter#inspect` (`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1236`) still renders `role="writing"` / `shard="default"` as quoted strings, and `packages/activerecord/src/adapter.test.ts:463` asserts that quoted form. Rails `abstract_adapter.rb` `inspect` uses `role.inspect` / `shard.inspect` → `role=:writing`.

## Acceptance criteria

- `AbstractAdapter#inspect` renders role/shard as Symbols like the pool does; `adapter.test.ts:463` updated to the Rails form.
