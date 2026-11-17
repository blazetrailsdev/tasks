---
title: "Port CacheStoreBehavior's fetch race condition protection"
status: draft
updated: 2026-11-17
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package activesupport` reports `cache/behaviors/cache_store_behavior.rb` at 65 ok, 1 skip, 1 missing. The missing test is `fetch race condition protection` (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/cache_store_behavior.rb:650-668`). It is absent from solid_cache's vendored copy, so trails#10252 did not port it. It writes a value with `expires_in: 60`, stubs `Time.now` to 61 seconds later, fetches with `expires_in:` and `race_condition_ttl: 10`, and asserts that the new value differs from the old one and is not nil. It then stubs `Time.now` to 120 seconds after the write and asserts the key is still readable.

## Acceptance criteria

- Ported into `packages/activesupport/test/cache/behaviors/cache-store-behavior.ts` at its Rails position, between `race condition protection` and `fetch multi race condition protection`, using `stub(Time, "now", …)` as its siblings do.
- memory-store, file-store and solid-cache suites pass.
