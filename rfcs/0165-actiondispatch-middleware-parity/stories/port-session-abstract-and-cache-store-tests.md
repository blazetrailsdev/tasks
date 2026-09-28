---
title: "Port the abstract-store, abstract-secure-store and cache-store session tests"
status: draft
updated: 2026-09-28
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps: ["cache-store-async-over-npm-clients", "middleware-stack-callbacks-and-session-store-shapes"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three files under `vendor/rails/v8.0.2/actionpack/test/dispatch/session/` have
no trails file:

- `abstract_store_test.rb`: `AbstractStoreTest` (`:30-55`), 3
- `abstract_secure_store_test.rb`: `AbstractSecureStoreTest` (`:39-48`), 2
- `cache_store_test.rb`: `CacheStoreTest` (`:37-186`), 11 — session data in
  `Rails.cache`, ids rotated on reset, `expire_after`, and the
  `private_id` / `public_id` lookups

`Session::CacheStore` reads and writes an `ActiveSupport::Cache` store, whose
async surface is RFC 0158's `cache-store-async-over-npm-clients`.

## Acceptance criteria

- The three files exist at their convention paths under `dispatch/session/` and
  port every test in Rails order, against an async `MemoryStore` as in Rails'
  tests.
- All three report complete.
