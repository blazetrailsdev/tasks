---
title: "ShardSelector: options.fetch(:lock, true) is key-presence, not ?? true"
status: draft
updated: 2026-08-14
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/middleware/shard_selector.rb:57`:

```ruby
ActiveRecord::Base.prohibit_shard_swapping(options.fetch(:lock, true), &block)
```

trails (`packages/activerecord/src/middleware/shard-selector.ts`) spells this
`this.options.lock ?? true` in both `setShard` and `shardSelectorStrategy`.
`fetch` returns the STORED value whenever the key exists — `{ lock: null }`
yields `nil` (falsy → no lock) in Rails but `true` in trails. The missing
`fetch` call is baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/middleware/shard-selector.json`
(`set_shard` → `fetch`).

Also: `shardSelectorStrategy()` has no counterpart in shard_selector.rb — check
whether it is invented surface or mirrors another Rails method, and remove it if
the former.

## Acceptance criteria

1. `setShard` honours Ruby `fetch(:lock, true)` semantics (key-presence, not
   nullish) — an explicitly-stored `null`/`false` disables the lock.
2. The `set_shard` → `fetch` baseline row is deleted by hand (only-shrink).
3. `pnpm vitest run packages/activerecord/src/shard-selector.test.ts` green.
