---
title: "Cache::Store#fetchMulti accepts trailing options hash (extract_options!)"
status: claimed
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-20T02:22:46Z"
assignee: "cache-store-fetch-multi-options"
blocked-by: null
---

## Context

Rails `Cache::Store#fetch_multi(*names)` (cache.rb:596) calls `names.extract_options!` so the last argument can be a per-call options hash, mirroring `read_multi` (converged in story `cache-store-read-multi-options`, PR #3686).

Our `Store.fetchMulti(...namesAndBlock)` in `packages/activesupport/src/cache/store.ts` pops only the trailing block and then calls `this.mergedOptions(undefined)` — it never extracts a trailing options hash, so per-call options (namespace, version, expiresIn, force, skipNil) cannot be passed to `fetchMulti`.

The `extractOptions` helper added in PR #3686 (same file) can be reused: pop the block first, then extract the trailing options object from the remaining args before treating the rest as names.

## Acceptance criteria

- `fetchMulti` extracts an optional trailing options object (the element before the block, if it is a plain object) and threads it through `mergedOptions` into both `readMultiEntries` and `writeMulti`.
- Existing `force` / `skipNil` behavior continues to honor per-call options.
- Cover in `cache-store-base.test.ts` with a test passing `namespace` (and verifying `force`/`expiresIn` via the trailing hash).
- api:compare delta non-negative; LOC ceiling <= 500.
