---
title: "redis-cache-store-binary-keys"
status: draft
updated: 2026-11-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RedisCacheStore#normalize_key` is `truncate_key super&.b`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/redis_cache_store.rb:404-406`), so every key it
uses is an ASCII-8BIT String, and `truncate_key` (`:408-416`) works with `bytesize` / `byteslice`. Root
CLAUDE.md § "A String has no encoding tag either" says an ASCII-8BIT String is a `Uint8Array` all the way
through. trails' `packages/activesupport/lib/cache/redis-cache-store.ts` keeps its keys as JS strings and
carries `@missingRailsName b — CONVERGEABLE redis-cache-store-binary-keys` on `normalizeKey`. solid-cache's
store (`packages/solid-cache/lib/store.ts`, `normalizeKey(): Promise<Uint8Array>`) already does it the
faithful way.

## Acceptance criteria

- `normalizeKey` answers `b(super)` (ruby-compat `b`), and `truncateKey` uses `bytesize` / `byteslice` on the
  `Uint8Array`.
- Every key-typed parameter on the store is `Uint8Array` and goes to ioredis as a `Buffer`.
- The receipt is removed.
