---
title: "Port mem_cache_store_test.rb once MemCacheStore descends from Rack::Session::Dalli"
status: blocked
updated: 2026-10-15
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["actionpack"]
deps:
  ["memcachestore-descends-from-rack-session-dalli", "port-session-abstract-and-cache-store-tests"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Owner decision 2026-10-15: memcached work deferred for now; also waits on memcachestore-descends-from-rack-session-dalli"
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/session/mem_cache_store_test.rb`:
`MemCacheStoreTest` (`:45-169`), 9 tests, no trails file. Rails'
`Session::MemCacheStore < Rack::Session::Dalli`, and `pnpm parity:api --inheritance`
reports the mismatch. RFC 0141's `memcachestore-descends-from-rack-session-dalli`
is blocked on the dalli gem being neither vendored nor wrapped over an npm
memcached client; this story waits on it.

## Acceptance criteria

- `dispatch/session/mem-cache-store.test.ts` ports all 9 tests, against the
  npm-backed client the dependency introduces.
- The file reports 9/9.
