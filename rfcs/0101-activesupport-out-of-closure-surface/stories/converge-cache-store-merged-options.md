---
title: "converge-cache-store-merged-options"
status: draft
updated: 2026-11-10
rfc: "0101-activesupport-out-of-closure-surface"
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

# Converge Cache::Store#merged_options onto Rails

## Context

`Store#mergedOptions` (`packages/activesupport/lib/cache/store.ts`, `mergedOptions` / `normalizeOptions`)
diverges from `merged_options` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:861-888`):

- `expiresAt` is a millisecond number; Rails takes a `Time` and computes `expires_at - Time.now` (:869).
- The Time guard is `instanceof Date` with message "should not be a Date. Did you mean to use expiresAt?"; Rails is `is_a?(Time)` with "expires_in parameter should not be a Time. Did you mean to use expires_at? Got: #{expires_in}" (:871-874).
- The both-supplied check uses `!= null`; Rails uses `key?` (:864).
- `normalizeOptions` reads snake `expire_in` / `expired_in`; option keys are camelCase (`expireIn`, `expiredIn`) per root CLAUDE.md § "`symbolize_keys` on an option hash".
- `WriteOptions#expiresAt` is typed `number`.

This blocks `test_expires_at`, `test_expire_in_is_alias_for_expires_in`, `test_expired_in_is_alias_for_expires_in`, `test_expires_in_and_expires_at`, `test_expires_in_from_now_raises_an_error` and `test_fetch_with_dynamic_options` in `cache_store_behavior.rb` (see `port-the-last-cache-store-behavior-cases`).

## Acceptance criteria

- `mergedOptions` mirrors `merged_options` line for line: Time-valued `expiresAt`, `Time` guard and Rails' message, `key?` semantics, camelCase alias keys.
- Existing cache tests stay green.
