---
title: "DefaultMiddlewareStack omits Rack::Cache: port load_rack_cache and mount it"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: ["port-rack-cache-context", "port-rails-meta-and-entity-stores"]
deps-rfc: []
est-loc: 150
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DefaultMiddlewareStack#build_stack`
(`vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:37-40`)
mounts `::Rack::Cache, rack_cache` between `ActionDispatch::Static` (`:34`) and
`Rack::Lock` (`:42-46`) when `load_rack_cache` (`:113-132`) answers a value.
`load_rack_cache` reads `config.action_dispatch.rack_cache` and returns `nil`
when it is falsy. Otherwise it runs `require "rack/cache"`, rescuing
`LoadError` to append " Be sure to add rack-cache to your Gemfile" and
re-raise. It maps `true` to
`{ metastore: "rails:/", entitystore: "rails:/", verbose: false }` and passes
any other value (a Hash) through. `build_stack` then requires
`action_dispatch/http/rack_cache` (`:38`) so `rails:/` resolves.

trails' `packages/trailties/src/application/default-middleware-stack.ts`
(`buildStack`, `:42`) wires every other middleware in that method but has no
`Rack::Cache`. `config.actionDispatch.rackCache` exists but is ignored
(`packages/trailties/src/trailties/action-dispatch.ts:27,78`), and it is typed
`boolean`, where Rails accepts `false`, `true` or an options Hash.

**Prerequisites, now tracked.** `Rack::Cache` itself is the
`rack-cache-gem-port` RFC (`@blazetrails/rack-cache`, rack-cache 1.17.0).
This story depends on `port-rack-cache-context`, which ports `Rack::Cache.new`
and `Context`. The `rails:/` stores are
`0164-actiondispatch-http-parity/port-rails-meta-and-entity-stores`, a
dependency too.

**Priority is low.** Rails defaults `rack_cache` to `false`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/railtie.rb:20`), so no
default app mounts it. Every other default-middleware gap in this RFC comes
first.

**The one non-mechanical part: a synchronous `require` in a synchronous
builder.** rack-cache is Gemfile-only in Rails (`vendor/rails/v8.0.2/Gemfile:18`),
so trailties takes `@blazetrails/rack-cache` as an optional peer, not a plain
dependency, and cannot import it statically. Rails' `require` is a synchronous
lazy load. `buildStack` is synchronous, and an ESM lazy load (`import()`) is
not. Decide how the loaded module reaches `buildStack`, with the Rails
`LoadError` arm intact. Options include resolving the import in an async boot
step that runs before the stack is built, or making the build async if its
callers already allow that. Check the other `load*`-style lazy requires in
trailties for a settled idiom before inventing one, and record the choice here
if it is new.

## Acceptance criteria

- [ ] `load_rack_cache` is ported as a private `loadRackCache` on
      `DefaultMiddlewareStack`, with Rails' falsy → `null`, `true` →
      default-hash and pass-through arms, and the `LoadError` message suffix.
- [ ] `config.actionDispatch.rackCache` is typed to admit `false`, `true` and an
      options hash, and still defaults to `false`.
- [ ] `buildStack` mounts `Rack::Cache` after `Static` and before `Rack::Lock`
      when `loadRackCache()` answers a value, after loading the actionpack
      `http/rack-cache` subpath so `rails:/` resolves.
- [ ] `packages/trailties/package.json` declares `@blazetrails/rack-cache` as an
      optional peer plus a workspace devDependency, not a plain dependency.
- [ ] A default app (`rackCache: false`) never loads `@blazetrails/rack-cache`.
