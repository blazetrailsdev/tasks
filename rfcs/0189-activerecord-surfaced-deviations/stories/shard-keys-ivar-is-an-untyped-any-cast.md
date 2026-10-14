---
title: "connectsTo's @shard_keys is an untyped (x as any)._shardKeys; give it a declared field"
status: draft
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails keeps `@shard_keys` as a class ivar set by `connects_to`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:81-83`,
`@shard_keys = shards.keys`) and read by `shard_keys` (`:347-349`,
`connection_class_for_self.instance_variable_get(:@shard_keys) || []`).
Rails' `ShardsKeysTest#setup` resets it with
`ActiveRecord::Base.instance_variable_set(:@shard_keys, nil)`
(`test/cases/shard_keys_test.rb:22`).

trails has no declared field for it: `connection-handling.ts:49` writes
`(this as any)._shardKeys = Object.keys(shards)` and `:323` reads
`(connClass as any)._shardKeys ?? []`. So `shard-keys.test.ts`'s `beforeEach`
resets it as `(Base as any)._shardKeys = undefined`, an untyped cast standing in
for `instance_variable_set`. Raised in review of trails#8898.

## Acceptance criteria

- [ ] `_shardKeys` is a declared static on the host type that `connectsTo` /
      `shardKeys` use, and both read and write it with no `any` cast.
- [ ] `shard-keys.test.ts`'s reset assigns the typed field (or a ruby-compat
      `instance_variable_set` port, if one exists by then) with no `any` cast.
