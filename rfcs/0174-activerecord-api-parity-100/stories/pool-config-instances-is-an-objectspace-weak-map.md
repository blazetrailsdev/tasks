---
title: "ruby-compat: port ObjectSpace::WeakMap; PoolConfig::INSTANCES walks it with each_key"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the two receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`PoolConfig` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/pool_config.rb:15-25,36`) keeps its instances in an `ObjectSpace::WeakMap`:

```ruby
INSTANCES = ObjectSpace::WeakMap.new
private_constant :INSTANCES

class << self
  def discard_pools!
    INSTANCES.each_key(&:discard_pool!)
  end

  def disconnect_all!
    INSTANCES.each_key { |c| c.disconnect!(automatic_reconnect: true) }
  end
end
# …
INSTANCES[self] = self
```

`packages/activerecord/src/connection-adapters/pool-config.ts` holds a `Set<WeakRef<PoolConfig>>` plus a `FinalizationRegistry`, and `discardPoolsBang` / `disconnectAllBang` each open-code the `deref` / prune loop with `@missingRailsCall each_key`. The constructor registers through `new WeakRef(this)` where Rails writes `INSTANCES[self] = self`.

A JS `WeakMap` cannot be iterated, which is the real gap, and it is one fact: `ObjectSpace::WeakMap#each_key` (`vendor/ruby/v3.3.11/weakmap.c:315` `wmap_each_key`) over live keys. The `WeakRef` set and the registry belong inside one ruby-compat class, not in each Rails-matched body that walks it.

## Acceptance criteria

- [ ] ruby-compat carries an `ObjectSpace.WeakMap` port with `[]=` and `each_key` (cited to `weakmap.c`), holding its keys weakly and yielding only live ones, with unit tests.
- [ ] `INSTANCES` is that class; the constructor's registration is the one index-assign; `discardPoolsBang` and `disconnectAllBang` are each one `eachKey` call.
- [ ] Both `@missingRailsCall each_key` receipts are deleted; `pnpm parity:api:calls` green with no new row.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/connection-handlers-multi-db.test.ts
```
