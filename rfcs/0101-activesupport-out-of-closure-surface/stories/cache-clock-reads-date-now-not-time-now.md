---
title: "ActiveSupport cache Entry/Store read Date.now instead of Time.now (travel_to does not reach the cache)"
status: draft
updated: 2026-09-28
rfc: "0101-activesupport-out-of-closure-surface"
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

Rails' cache clock is `Time.now`: `Cache::Entry#initialize` computes `expires_in.to_f + Time.now.to_f` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/entry.rb:29`) and `#expired?` compares against `Time.now.to_f` (`entry.rb:44`). `Store#merged_options` computes `expires_at - Time.now` (`cache.rb:869`), and `handle_expired_entry` uses `Time.now.to_f` for the race TTL (`cache.rb:1034,1037`). So `travel_to` moves cache expiry.

trails reads `Date.now()` at all five sites: `packages/activesupport/src/cache/entry.ts` (constructor, `isExpired`) and `packages/activesupport/src/cache/store.ts` (`mergedOptions`, `handleExpiredEntry`). It also keeps milliseconds where Rails keeps float seconds. `travelTo` (`testing/time-helpers.ts`) stubs `Time.now`, not `Date.now`, so it does not reach the cache. trails#8203's port of `rate_limiting_test.rb` (`action-controller/controller/rate-limiting.test.ts`) had to use `vi.useFakeTimers()` in place of Rails' `travel_to 3.seconds.from_now`.

Two related Duration gaps sit in the same bodies:

- `merged_options`' `call_options[:expires_in]&.negative?` (`cache.rb:875`) is ported as `(call.expiresIn as number) < 0`, which is always false for a `Duration`.
- `handle_expired_entry`'s `options[:race_condition_ttl].to_i` (`cache.rb:1033`) is ported as `typeof === "number" ? … : 0`, which drops a `Duration` race TTL.

## Acceptance criteria

- Entry and Store read the clock through `Time.now` (`toF()` seconds), mirroring `entry.rb:29,44` and `cache.rb:869,1034,1037`.
- The negative check calls `negative?` (`Duration#isNegative`, numeric `< 0`), and the race TTL calls `to_i` on a `Duration`.
- `rate-limiting.test.ts` swaps `vi.advanceTimersByTime` back to `travelTo` with Rails' `3.seconds.from_now`.
