---
title: "port-solid-cache-record-configuration-and-entry"
status: draft
updated: 2026-11-13
rfc: "0196-solid-stack"
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

# Port SolidCache::Record, Configuration and Entry (first slice of the store port)

## Context

`port-solid-cache-entry-model-and-store` cannot ship its fallback slice
(Entry + `api` / `entries`) alone: `Store::Entries`
(`vendor/solid_cache/v1.0.7/lib/solid_cache/store/entries.rb:21-77`) runs every
call through `reading_key` / `writing_key` / `writing_all`
(`store/connections.rb:62-105`), which go through `failsafe`
(`store/failsafe.rb`) and `execute` (`store/execution.rb`). The Ruby source
behind the store alone is ~1150 lines, so the AR-model layer goes first:

- `app/models/solid_cache/record.rb` (52): `NULL_INSTRUMENTER`,
  `disable_instrumentation`, `with_instrumenter`, `with_shard`, `each_shard`.
- `lib/solid_cache/configuration.rb` (59): `encrypt?`, `connects_to`,
  `sharded?`, `shard_keys`, `store_options`.
- `app/models/solid_cache/entry.rb` (145) with `entry/encryption.rb`,
  `entry/expiration.rb`, `entry/size.rb`, `entry/size/estimate.rb` and
  `entry/size/moving_average_estimate.rb`.
- Schema: the gem's `db/cache_schema.rb` (`solid_cache_entries`).
- Already ported: `packages/solid-cache/lib/solid-cache.ts`, `maglev-hash.ts`.

## Acceptance criteria

- `Record`, `Configuration` and `Entry` (with its included modules) are ported
  at their Rails names and in Rails method order, over the `cache_schema.rb` table.
- `test/models/solid_cache/entry_test.rb`, `record_test.rb` and
  `entry/size/*_test.rb` are ported with the Rails test names.
