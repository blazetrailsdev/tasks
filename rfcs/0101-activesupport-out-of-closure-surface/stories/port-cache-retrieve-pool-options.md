---
title: "Port Cache.retrieve_pool_options and DEFAULT_POOL_OPTIONS"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6445
claim: "2026-08-12T23:56:50Z"
assignee: "export-dupcoder-dump-value-and-load-value"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Cache.retrieve_pool_options` (activesupport/lib/active_support/cache.rb:82-103,
called from `lookup_store`'s store-class path) is the last member missing from
`cache.rb` on the api-compare denominator — 62/63 after
`port-cache-store-coder-and-serializer-layer` (#6440) landed.

Rails body, verbatim shape to port into `packages/activesupport/src/cache.ts`:

- `options.key?(:pool)` → `pool_options = options.delete(:pool)`, else `true`.
- `case pool_options`: `false, nil` → return `false`; `true` →
  `DEFAULT_POOL_OPTIONS` (cache.rb:47-51); `Hash` → coerce `:size` with
  `Integer()` and `:timeout` with `Float()` when present, then
  `DEFAULT_POOL_OPTIONS.merge(pool_options)`; else raise `TypeError,
"Invalid :pool argument, expected Hash, got: #{pool_options.inspect}"`.
- Returns `pool_options unless pool_options.empty?`.

`DEFAULT_POOL_OPTIONS` (cache.rb:47) is also unported.

Note the Ruby-idiom traps: `options.key?(:pool)` distinguishes a stored `nil`
from an absent key (so `?? true` is wrong), and the `when false, nil` arm is an
early `return false` distinct from the trailing `unless empty?` nil.

## Acceptance criteria

- `retrievePoolOptions` and `DEFAULT_POOL_OPTIONS` exist in `cache.ts` with the
  Rails bodies and are called from `lookup_store`'s call site.
- `pnpm parity:api` activesupport `cache.rb` reaches 63/63.
- `pnpm parity:api:calls` / `:args` clean with no new baseline rows.
