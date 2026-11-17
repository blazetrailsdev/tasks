---
title: "solid-cache-store-behavior-missing-tests"
status: draft
updated: 2026-11-17
rfc: "0196-solid-stack"
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

`pnpm parity:test --package solid-cache` stands at 242/265. 18 of the missing tests are `CacheStoreBehavior` tests that `packages/activesupport/test/cache/behaviors/cache-store-behavior.ts` has never ported, so neither activesupport's memory/file stores nor solid-cache run them: `fetch with dynamic options` (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/cache_store_behavior.rb:47`), `original store objects should not be immutable` (:456), `expires in` / `expires at` / `expire in is alias…` / `expired in is alias…` / `expires in and expires at` (:462-552), `expires in from now raises an error` (:580), the four `race condition protection*` tests (:591-648), `fetch multi race condition protection` (:670), `absurd key characters` (:686), `really long keys` (:697), `cache hit instrumentation` / `cache miss instrumentation` (:706-732), `setting options in fetch block does not change cache options` (:734).

## Acceptance criteria

- Each test is ported into `cache-store-behavior.ts` at its Rails name and position; a test that turns on Ruby String mutability is parked as `PERMANENT-SKIP` per CLAUDE.md § "Ruby Strings are JS string primitives".
- memory-store, file-store and solid-cache suites pass with them.
- parity:test solid-cache CacheStoreBehavior row reaches 66/66.
