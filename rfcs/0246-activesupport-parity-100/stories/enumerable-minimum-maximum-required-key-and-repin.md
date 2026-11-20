---
title: "Enumerable#minimum/maximum take a required key; re-pin core_ext/enumerable.rb"
status: ready
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
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

`packages/activesupport/lib/core-ext/enumerable.ts` `minimum` / `maximum` take `key = null` and answer `min`/`max` of the whole collection when no key is passed. Rails' `minimum(key)` / `maximum(key)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:32-42`) are `map(&key).min` / `map(&key).max` with a required key. The null arm exists only for `test/core-ext/enumerable.trails.test.ts`'s `rbFSend([3, 9, 4], "maximum", null)`. After trails#10399 re-pinned `core_ext/enumerable.rb`, only `maximum` was written to `scripts/api-compare/body-pins.json`; the other 12 pairs (`compact_blank`, `exclude?`, `excluding`, `in_order_of`, `including`, `index_by`, `index_with`, `many?`, `minimum`, `pick`, `pluck`, `sole`) remain unpinned.

## Acceptance criteria

- `minimum` / `maximum` take a required `key` (name or function), with no null arm; the trails-only null-key assertion is removed.
- The remaining `core_ext/enumerable.rb` pairs are pinned with `tsx scripts/api-compare/body-pins.ts --pin core_ext/enumerable.rb`, or each unpinnable pair's mismatch is filed.
