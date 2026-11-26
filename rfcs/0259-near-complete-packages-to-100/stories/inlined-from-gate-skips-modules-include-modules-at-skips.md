---
title: "inlined-from-gate-skips-modules-include-modules-at-skips"
status: claimed
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T03:44:51Z"
assignee: "encrypted-configuration-invalid-content-error-message-override"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Session::MemCacheStore` includes `Compatibility`, `StaleSessionCheck` and `SessionObject` (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/middleware/session/mem_cache_store.rb:23-26`). Its trails superclass chain (`CacheStore` → `AbstractSecureStore`) already includes all three. So Ruby's `include_modules_at` skips them (`vendor/ruby/v3.3.11/class.c:1281,1291,1296`), and `Compatibility#initialize` runs once.

trails#10760 moved that body into `Rack::Session::Abstract::Persisted`'s constructor, behind `isModuleIncluded(new.target, Compatibility)`. That guard already runs it for `MemCacheStore`. But `scripts/api-compare/lint-inlined-from.ts` reads the manifest's include record on `MemCacheStore` and requires an `@inlinedFrom Compatibility#initialize` segment in `packages/actionpack/lib/action-dispatch/middleware/session/mem-cache-store.ts`. A tag with no body raises a `key?` call-mismatch row. So the constructor keeps a duplicate `options.key ||= "_session_id"` line. The line is idempotent, but Ruby does not run it twice.

## Acceptance criteria

- [ ] The inlined-from gate (`reachedHooks` / `methodChain`) drops a module whose include `include_modules_at` would skip, because a superclass already has it.
- [ ] `MemCacheStore`'s constructor loses the duplicate `key` line and its `@inlinedFrom` tag, and `pnpm parity:api:inlined` / `parity:api:calls` stay green.
