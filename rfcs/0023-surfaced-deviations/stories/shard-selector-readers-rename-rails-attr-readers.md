---
title: "shardResolver/shardSelectorStrategy rename ShardSelector's attr_reader :resolver, :options"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #7115 (RFC 0121, activerecord enrollment) while re-deriving the
citations for three receipts on `ShardSelector`.

Rails' `ShardSelector` exposes its two ivars through a plain reader pair:

```ruby
# vendor/rails/activerecord/lib/active_record/middleware/shard_selector.rb:38
attr_reader :resolver, :options
```

trails renames both and reshapes one
(`packages/activerecord/src/middleware/shard-selector.ts`):

- `shardResolver()` -> Rails `resolver`
- `shardSelectorStrategy()` returns `{ lock }` -> Rails `options`, which the
  Ruby body indexes inline at the use site (`shard_selector.rb:35`,
  `@options[:lock]`)

The receipts written in #7115 record both as CONVERGEABLE against
`shard_selector.rb:38`. There is no language shortcoming here — these are plain
readers with plain Rails names, so `parity:api` cannot credit either one.

A third name on the same class, `instrumenter()`, is a different shape: Rails
puts `instrumenter` on `DatabaseSelector::Resolver`
(`middleware/database_selector/resolver.rb:33`, `attr_reader :context, :delay,
:instrumenter`) and gives `ShardSelector` no counterpart at all. trails added one
to both middlewares. The `database_selector.ts` copy mirrors a real Rails reader
in the wrong class; the `shard_selector.ts` copy mirrors nothing.

## Converged shape

- Rename `shardResolver` -> `resolver` and `shardSelectorStrategy` -> `options`,
  with `options` returning the options object Rails keeps rather than a derived
  `{ lock }`, and move the `lock` read to the use site the way
  `shard_selector.rb:35` does.
- For `instrumenter`: either move it onto the resolver, where Rails declares it,
  or delete it and name the notifier at the call site. Do not keep a copy on
  `ShardSelector`, which Rails gives none.
- Check `docs/ruby-ts-conventions.md` produces exactly these spellings before
  picking them.

## Acceptance criteria

- `shard-selector.ts` carries the Rails names, and the three
  `@noRailsEquivalent` receipts written in #7115 are DELETED rather than
  reworded (a matched name needs no receipt).
- `pnpm parity:api:extra:gate` green with activerecord's marks moving DOWN or
  unchanged; `pnpm parity:api` delta non-negative.
- `pnpm parity:api:calls` / `:calls:args` clean — the `lock` read moving to the
  call site changes a call set.
