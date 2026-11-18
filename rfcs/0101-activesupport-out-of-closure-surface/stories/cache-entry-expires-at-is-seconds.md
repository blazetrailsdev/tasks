---
title: "cache-entry-expires-at-is-seconds"
status: done
updated: 2026-11-18
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10252
claim: "2026-11-17T16:39:37Z"
assignee: "cache-entry-expires-at-is-seconds"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::Cache::Entry` keeps `@expires_in` as Float seconds since the epoch (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/entry.rb:25-31`: `@expires_in = expires_at&.to_f || expires_in && (expires_in.to_f + Time.now.to_f)`), so `Entry#expires_at` is seconds and `expired?` compares against `Time.now.to_f`. trails' `packages/activesupport/lib/cache/entry.ts:36-62` keeps milliseconds (`expiresIn * 1000 + Time.now().toF() * 1000`, `<= Time.now().toF() * 1000`). As a result, the ported `race condition protection skipped if not defined` (`packages/activesupport/test/cache/behaviors/cache-store-behavior.ts`) has to write `Time.at(time / 1000)` where Rails writes `Time.at(time)` (`cache_store_behavior.rb:594-596`). Readers of `entry.expiresAt` include `memory-store.ts:169,212,226`, `file-store.ts:271`, `coder.ts` (`LazyEntryOptions`, packed format), and solid-cache's store/entry. Surfaced by trails#10252 review.

## Acceptance criteria

- `Entry` stores and answers seconds, as `entry.rb` does; every reader and the coder's packed format convert.
- The behavior test reads `Time.at(time)`, as Rails does.
- activesupport cache and solid-cache suites pass.
