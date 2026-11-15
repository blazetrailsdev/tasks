---
title: "Order stream drops a zero-arg new Hash()/new Map() (Ruby hash literal); retire write_multi order row"
status: draft
updated: 2026-11-15
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10123 added `scripts/api-compare/call-mismatches-exclude/activesupport/cache.json`, a row for `write_multi` `order:constructor,normalizeKey`. Rails `ActiveSupport::Cache::Store#write_multi` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:551-564`) builds `normalized_hash = hash.transform_keys { |key| normalize_key(key, options) }`, which allocates with no `.new` call. The TS port (`packages/activesupport/lib/cache/store.ts`, `writeMulti`) has to write `new Hash<string | Uint8Array, unknown>()` before an awaited loop, because `normalizeKey` is async and a SolidCache binary key cannot key a plain object. The extractor records that zero-argument construction as `constructor` ahead of the first `normalizeKey`. Ruby's `{}` / `transform_keys` / `each_with_object({})` emit no site, so the order stream diverges on allocation alone.

## Acceptance criteria

- The TS order stream (`scripts/api-compare/extract-ts-api.ts`, `callSiteName` / `collectCalls`) drops a zero-argument `new Hash()` / `new Map()` from the ORDER stream, the way `isThrownConstruction` drops a thrown construction, so it stands in for a Ruby hash literal. The call set is unchanged.
- Delete the `write_multi` row and its now-empty `activesupport/cache.json`. `pnpm parity:api:calls` stays OK.
- Delete any other `order:constructor,…` rows the change makes stale, by hand, and narrow the marks with `:tighten`.
