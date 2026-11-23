---
title: "Port v8.0.5.2 session StoreSharedTests and the new CacheStore tests"
status: draft
updated: 2026-11-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails v8.0.5.2 moves the session-store tests onto a shared module,
`vendor/rails/v8.0.5.2/actionpack/test/dispatch/session/store_shared_tests.rb`
(`include StoreSharedTests` in `cache_store_test.rb:7` and `cookie_store_test.rb:8`),
and adds CacheStore tests that trails has no twin for
(`vendor/rails/v8.0.5.2/actionpack/test/dispatch/session/cache_store_test.rb:130-372`):
`session logged out during a request stays logged out`, `... during a writing request stays logged out`,
`... does not resend its cookie`, `session reset by the request is saved under the new id`,
`session read by legacy id is saved under private id`, `cookie only false reads session id from params`,
`same site in subclass default options wins over default`, `initialize does not add same site to the callers options`,
plus the `LocallyCachedStore` fixture (`:12-37`). The code they cover
(`LOADED_SESSION_ID`, `destroyed_since_loaded?`, `exist_in_backend?`) landed in trails#10671
(`packages/actionpack/lib/action-dispatch/middleware/session/cache-store.ts`).

## Acceptance criteria

- [ ] `StoreSharedTests` ported beside the store tests, and included by `cache-store.test.ts` and `cookie-store.test.ts` as Rails does.
- [ ] Each added CacheStore test above ported under its Rails name in `packages/actionpack/test/action-dispatch/dispatch/session/cache-store.test.ts`.
