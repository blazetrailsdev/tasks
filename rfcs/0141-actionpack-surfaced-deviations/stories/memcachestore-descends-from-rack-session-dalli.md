---
title: "MemCacheStore descends from CacheStore; converge onto a ported Rack::Session::Dalli"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
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

Rails' `ActionDispatch::Session::MemCacheStore < Rack::Session::Dalli`
(`actionpack/lib/action_dispatch/middleware/session/mem_cache_store.rb:23`), and it
includes `Compatibility`, `StaleSessionCheck` and `SessionObject` into that
ancestry (`mem_cache_store.rb:24-26`). `Rack::Session::Dalli` does not descend
from `AbstractStore`, so there those includes really do add the modules.

trails#8117 left `MemCacheStore extends CacheStore`
(`packages/actionpack/src/action-dispatch/middleware/session/mem-cache-store.ts`).
`CacheStore < AbstractSecureStore` already includes the three modules
(`abstract_store.rb:97-100`). The three `include` calls would have been skipped
(`vendor/ruby/class.c:1281,1291,1296`), so #8117 removed them, and the class
JSDoc records the divergence. The superclass itself is the remaining deviation:
nothing in trails stands where `Rack::Session::Dalli` does, because the dalli gem
is not vendored.

## Converged shape

- Vendor the dalli gem's `rack/session/dalli.rb`.
- Port `Rack::Session::Dalli` as an async wrapper over an npm memcached client,
  like the other gem-backed ports (`cache-store-async-over-npm-clients`).
- Make `MemCacheStore extends` it, restoring the three `include(MemCacheStore, …)`
  calls, which then add the modules as Ruby's do.

## Acceptance criteria

- `MemCacheStore`'s superclass is the trails `Rack::Session::Dalli`, and its three
  `include`s match `mem_cache_store.rb:24-26`.
- The class JSDoc's divergence note is removed.
- `mem-cache-store.test.ts` keeps its test names.
