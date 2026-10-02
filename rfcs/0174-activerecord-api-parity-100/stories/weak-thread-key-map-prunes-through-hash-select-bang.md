---
title: "activerecord: WeakThreadKeyMap#[]= prunes dead threads through Hash#select!"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ConnectionPool::WeakThreadKeyMap#[]=` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:140-143`):

```ruby
def []=(key, value)
  @map.select! { |c, _| c&.alive? }
  @map[key] = value
end
```

`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`'s `WeakThreadKeyMap#set` walks a copy of the keys and `delete`s the dead
ones — `select!` with no `select!` call — and carries `@missingRailsCall select!`. `@map` is a Ruby
`Hash` (`connection_pool.rb:129`); trails holds a bare `Map`.

ruby-compat's `Hash` class (`packages/ruby-compat/src/hash.ts`) has no `select!` / `keep_if`
(`vendor/ruby/v3.3.11/hash.c:2813` `rb_hash_select_bang`). `keepIf` exists only for the plain-object arm.

## Acceptance criteria

- [ ] ruby-compat's `Hash` answers `selectBang` (`rb_hash_select_bang`: deletes each pair the block rejects, returns `nil` when nothing changed), with its MRI anchor and unit tests.
- [ ] `WeakThreadKeyMap`'s `_map` is a `Hash`, and `set` is `this._map.selectBang((c) => c?.isAlive())` then the store.
- [ ] The `@missingRailsCall select!` receipt is deleted; `pnpm parity:api:calls` green with no new row.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-pool.test.ts packages/ruby-compat/src/hash.trails.test.ts
```
