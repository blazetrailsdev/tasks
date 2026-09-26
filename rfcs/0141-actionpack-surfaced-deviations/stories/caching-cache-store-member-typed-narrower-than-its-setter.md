---
title: "CachingClassMethods.cacheStore is typed narrower than cache_store= accepts"
status: ready
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `AbstractController::Caching::ConfigMethods#cache_store=` (`vendor/rails/actionpack/lib/abstract_controller/caching.rb:19-21`) takes anything `ActiveSupport::Cache.lookup_store(*store)` does. That covers a store instance, a Symbol, or a `[:file_store, path]` pair.

trails' setter (`packages/actionpack/src/abstract-controller/caching.ts`, `ConfigMethods`) accepts `unknown` and calls `lookupStore`. The `CachingClassMethods` / `CachingHost` interfaces type the member as `cacheStore?: CacheStore | null`, though. So a Rails-shaped assignment like `controller.cacheStore = [":file_store", path]` needs a cast. For example, `log-subscriber.test.ts` has `as unknown as CacheStore` since trails#8118. A getter/setter pair in the interface fails because TS accessors cannot be optional, and hosts such as `caching.test.ts`'s `HostClass` omit the member.

## Converged shape

- Type the member so the write side takes the `lookup_store` argument shapes (a store, a `":name"` string, or an array starting with one) and the read side stays `CacheStore | null`.
- Either make the accessor pair required and have hosts declare it, or split the interfaces.
- Drop the cast in `log-subscriber.test.ts`.

## Acceptance criteria

- [ ] `controllerClass.cacheStore = [":file_store", path]` type-checks with no cast.
- [ ] The reader still returns `CacheStore | null`.
