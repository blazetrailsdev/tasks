---
title: "Make Rack::Cache usable by middleware use"
status: in-progress
updated: 2026-11-22
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10592
claim: "2026-11-22T19:34:13Z"
assignee: "rack-cache-context-types-options-accessors"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Cache.new(backend, options={}, &b)` is a module function returning a `Context` (`vendor/rack-cache/v1.17.0/lib/rack/cache.rb:42-44`), and Rails mounts it with `middleware.use ::Rack::Cache, rack_cache` (`vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:39`). Ruby's `Builder#use` calls `middleware.new(app, *args, &block)`. trails' `Builder#use` (`packages/rack/lib/builder.ts:99`) spells that `new (middleware as MiddlewareFactory)(app, ...)`. trails#10582 ported `Rack::Cache` as a namespace module (`packages/rack-cache/lib/cache.ts`) whose `new` export is a plain function, so `builder.use(Rack.Cache, opts)` throws `TypeError: not a constructor`.

## Acceptance criteria

- [ ] `use(Rack.Cache, opts)` on a Rack `Builder` and an ActionDispatch `MiddlewareStack` builds a `Context`, the way Ruby's `middleware.new` reaches `Rack::Cache.new`. Converge the call shape the builder uses toward Ruby's `.new` dispatch rather than inventing a wrapper class.
- [ ] A test builds a stack with `Rack.Cache` and serves one request through it.
