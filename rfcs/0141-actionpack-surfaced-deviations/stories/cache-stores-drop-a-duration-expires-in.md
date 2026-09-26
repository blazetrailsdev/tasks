---
title: "ActiveSupport cache stores drop a Duration expires_in (rate_limit within: 3.minutes never expires)"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rate_limit to:, within: 3.minutes` passes the Duration straight through to
`store.increment(cache_key, 1, expires_in: within)`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rate_limiting.rb:62`),
and Rails' cache normalizes it on receipt: `Entry#initialize` does
`expires_in.to_f + Time.now.to_f`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/entry.rb:29`).

trails now types `within:` as `number | Duration`
(`packages/actionpack/src/action-controller/metal/rate-limiting.ts`), and the
trails-only `MemoryRateLimitStore` converts with `toF()`. But when the store is
the controller's `cacheStore` (an ActiveSupport cache store — the default the
generated authentication app relies on), the Duration is lost:

- `packages/activesupport/src/cache/store.ts:302,352,391` pass
  `expiresIn: typeof options.expiresIn === "number" ? options.expiresIn : null`,
  so a Duration becomes "never expires".
- `packages/activesupport/src/cache/entry.ts:35-36` computes
  `options.expiresIn * 1000`, which is `NaN` for a Duration.
- `StoreOptions.expiresIn` (`cache/index.ts:4`, `memory-store.ts:38`) is typed
  `number`, so the generated `rateLimit({ within: minutes(3) })` only
  type-checks against `RateLimitStore`, not the concrete store.

## Acceptance criteria

- ActiveSupport cache stores accept a `Duration` for `expiresIn` (and
  `expiresAt`/race TTL where Rails accepts one) and normalize it with `toF()` at
  the site Rails does (`Entry#initialize`, `entry.rb:29`), not at each caller.
- `RateLimitStore#increment`'s `expiresIn` stays `number | Duration`, and a
  `rate_limit within: <Duration>` backed by a `MemoryStore` expires the counter
  (test with a frozen clock).
