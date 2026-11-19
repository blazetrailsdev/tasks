---
title: "Type actionpack class-modules against their including host"
status: blocked
updated: 2026-11-18
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10322
claim: "2026-11-18T22:06:38Z"
assignee: "actionpack-callback-block-receives-declaring-controller"
blocked-by: "operator decision: typing a getter on Http::Cache::Response / Flash::RequestMethods / Http::Parameters against its host without a cast makes the host's getHeader/setHeader/hasHeader/deleteHeader/controllerClassFor public (actiondispatch extra total 6 to 14, measured in trails#10322) or adds @internal members (gated internal count). StrongParameters and caching converged in trails#10322; 34 to 30."
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
