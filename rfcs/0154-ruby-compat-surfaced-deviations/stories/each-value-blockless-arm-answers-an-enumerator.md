---
title: "ruby-compat: eachValue with no block answers an Enumerator, not an array"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

Raised in review of trails#8491.

Ruby's `Hash#each_value` with no block is `RETURN_SIZED_ENUMERATOR`
(`vendor/ruby/v3.3.11/hash.c:3060-3061`): it answers an `Enumerator` over the receiver.
ruby-compat's `eachValue` (`packages/ruby-compat/src/hash.ts`, the blockless overload) answers
`Object.values(hash)`, an eager array, and `attribute-assignment.ts:99` calls `.every` on that array.

So a Rails body that forwards a possibly-absent block, such as
`@role_to_shard_mapping[role].each_value(&block)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/pool_manager.rb:26-34`),
cannot be ported as the one call. `PoolManager#eachPoolConfig`
(`packages/activerecord/src/connection-adapters/pool-manager.ts`) carries an extra
`if (!block) return toEnum(...)` arm for it, receipted `@inventedArm if — CONVERGEABLE` against this
story.

## Acceptance criteria

- [ ] `eachValue` with no block answers an `Enumerator` (`packages/ruby-compat/src/enumerator.ts`), and its blockless callers are updated.
- [ ] `PoolManager#eachPoolConfig` is `eachValue(this._roleToShardMapping[role], block)` with no blockless arm, and its receipt is deleted.
