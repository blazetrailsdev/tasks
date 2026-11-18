---
title: "Type actionpack class-modules against their including host"
status: draft
updated: 2026-11-18
rfc: "0242-activerecord-actionpack-type-polish"
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

trails#10301 left 13 `as unknown as` casts in actionpack `lib/` where a class written as a Ruby module reads members of the class that includes it:

- `ChainedCookieJars` ×3 (`action-dispatch/middleware/cookies.ts:113-121`). Rails: `cookies.rb` `ChainedCookieJars#permanent` / `signed` / `encrypted` pass `self`.
- `Flash::RequestMethods` ×3 (`action-dispatch/middleware/flash.ts:39-50`). Rails: `flash.rb` `RequestMethods#flash` / `flash=` / `flash_hash` call `session` / `set_header` / `get_header`.
- `StrongParameters#params` / `params=` (`action-controller/metal/strong-parameters.ts:1025,1035`).
- `Http::Parameters#params` / `path_parameters` (`action-dispatch/http/parameters.ts:87,91`).
- `Http::Cache::Response#etag=` (`action-dispatch/http/cache.ts:207`).
- `Collector` (`abstract-controller/collector.ts:18`).
- The routing assertions `ClassMethods` seat (`action-dispatch/testing/assertions/routing.ts:440`).

A JS getter cannot declare a `this` parameter. A `declare` for the host's members adds extra surface: making `getHeader` and its siblings public on cache.ts raised the actiondispatch extra-surface `total` from 6 to 9.

## Acceptance criteria

- [ ] Type each of these modules against its host, for example by declaration-merging an interface that names the host's members, without raising `parity:api:extra:gate`. Remove the casts.
- [ ] The actionpack `as unknown as` count, measured outside `routing/`, falls by at least 10.
