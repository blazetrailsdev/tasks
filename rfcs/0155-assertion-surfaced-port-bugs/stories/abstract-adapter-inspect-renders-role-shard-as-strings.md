---
title: "AbstractAdapter#inspect renders role/shard as strings, Rails renders Symbols"
status: in-progress
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#7989
claim: "2026-09-22T23:11:04Z"
assignee: "abstract-adapter-inspect-renders-role-shard-as-strings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7885. Rails renders Symbol values via `inspect` (`:writing`, `:shard_one`). `ConnectionPool#inspect` now does this (`connection_pool.rb:278`, `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:301`), but `AbstractAdapter#inspect` (`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1236`) still renders `role="writing"` / `shard="default"` as quoted strings, and `packages/activerecord/src/adapter.test.ts:463` asserts that quoted form. Rails `abstract_adapter.rb` `inspect` uses `role.inspect` / `shard.inspect` → `role=:writing`.

## Acceptance criteria

- `AbstractAdapter#inspect` renders role/shard as Symbols like the pool does; `adapter.test.ts:463` updated to the Rails form.
