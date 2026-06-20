---
title: "cache-store-read-multi-options"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3686
claim: "2026-06-20T01:11:55Z"
assignee: "cache-store-read-multi-options"
blocked-by: null
---

## Context

Rails `Cache::Store#read_multi(*names)` (cache.rb:538) calls `names.extract_options!` so the last argument can be an options hash:

```ruby
cache.read_multi("a", "b", expires_in: 30)
```

Current `store.ts` `readMulti(...names: string[])` only accepts strings. There is no options extraction path, so per-call options (namespace, version, etc.) cannot be passed to `readMulti`.

Related: `fetch_multi` in Rails also calls `extract_options!` on the names array (cache.rb:596) before the block.

## Acceptance criteria

- Update `readMulti` to accept an optional trailing options object (last element of rest args if it is a plain object, not a string)
- Pass the extracted options through `mergedOptions` and into `readMultiEntries`
- Cover in `cache-store-base.test.ts` with a test passing `namespace` option
- api:compare delta non-negative; LOC ceiling ≤ 500
