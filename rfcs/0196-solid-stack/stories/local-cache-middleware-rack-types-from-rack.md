---
title: "LocalCache::Middleware imports Rack env/response types instead of redeclaring them"
status: done
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10198
claim: "2026-11-16T18:42:15Z"
assignee: "local-cache-middleware-rack-types-from-rack"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/cache/strategy/local-cache-middleware.ts:4-8` declares its own `RackEnv`, `RackResponse` and `RackApp` types. Rails' `Middleware` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/strategy/local_cache_middleware.rb:27-40`) uses Rack's own env/response shapes, which `@blazetrails/rack` exports. trails#10169 made `@blazetrails/rack` an optional peer and devDependency of activesupport, and loads it by an awaited `rbFRequire`, so type-only imports are now possible.

## Acceptance criteria

- The local Rack type aliases are replaced by `import type` from `@blazetrails/rack`, or deleted if the rack types cannot be imported because of the optional peer. Either way the reason is recorded.
- Typecheck and the activesupport and actionview DX type tests stay green.
