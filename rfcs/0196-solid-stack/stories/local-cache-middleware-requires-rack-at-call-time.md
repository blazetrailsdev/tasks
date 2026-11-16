---
title: "LocalCache::Middleware loads Rack::BodyProxy instead of assuming rack is already imported"
status: done
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10169
claim: "2026-11-16T00:51:34Z"
assignee: "local-cache-middleware-requires-rack-at-call-time"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/strategy/local_cache_middleware.rb:3-4` requires `rack/body_proxy` and `rack/utils` before `Middleware` uses `::Rack::BodyProxy` (`:30`) and `Rack::Utils::InvalidParameterError` (`:35`). By operator ruling on trails#10150, activesupport does not depend on rack. So `packages/activesupport/lib/cache/strategy/local-cache-middleware.ts` resolves both through `constGet(Object, "::Rack::BodyProxy")` / `"Rack::Utils::InvalidParameterError"` at call time and loads nothing. A process that has not imported `@blazetrails/rack` gets a `NameError` on its first request, where Ruby's `require` would have loaded the file. The Rack env/response/app types are also declared locally in that file.

## Acceptance criteria

- `Middleware#call` reaches `Rack::BodyProxy` and `Rack::Utils::InvalidParameterError` without depending on the application having imported rack first. One way is an awaited load step, as `ConnectionAdapters.load` does for adapter files (root CLAUDE.md § "An adapter file is loaded by an awaited step"). Another is the app's boot loading rack before the cache middleware is inserted. activesupport still does not depend on rack.
- A test proves the middleware works in a process where nothing else has imported rack.
