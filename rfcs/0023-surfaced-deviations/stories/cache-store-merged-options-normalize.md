---
title: "cache-store-merged-options-normalize"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`ActiveSupport::Cache::Store#merged_options` (cache.rb:861–888) calls `normalize_options` before merging. `normalize_options` does three things:

1. **Option aliases**: `OPTION_ALIASES = { expires_in: [:expire_in, :expired_in] }` — callers who pass `expire_in:` or `expired_in:` have those keys aliased to `expires_in` (cache.rb:876).
2. **`expires_at` → `expires_in` conversion**: if `expires_at` is present, converts to relative seconds `(expires_at - Time.now)` (cache.rb:882).
3. **Negative `expires_in` handling**: calls `handle_invalid_expires_in` which raises or logs depending on `raiseOnInvalidCacheExpirationTime` (cache.rb:884).
4. **Conflict guard**: raises `ArgumentError` if both `expires_in` and `expires_at` are passed (cache.rb:880).

Current `store.ts` `mergedOptions` is a plain spread (cache/store.ts) — none of this normalization runs. Callers passing `expire_in:` or `expires_at:` at the store call site will have those keys stored raw but never honored for expiry.

`WriteOptions#expiresAt=` (ported in PR #3682) does the conversion for block-path callers; non-block callers (`write`, `read`, etc.) still lack it.

## Acceptance criteria

- Port `normalize_options` into `mergedOptions` in `cache/store.ts`
- Alias `expire_in` and `expired_in` → `expires_in`
- Convert `expires_at` (absolute epoch-ms) → `expires_in` (relative seconds)
- Raise `ArgumentError` when both `expires_in` and `expires_at` are supplied
- Respect `Store.raiseOnInvalidCacheExpirationTime` for negative `expires_in`
- Cover each branch in `cache-store-base.test.ts`
- api:compare delta non-negative; LOC ceiling ≤ 500
