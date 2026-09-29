---
title: "default-middleware-stack-omits-rack-cache"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
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
mounts `::Rack::Cache, rack_cache` when `load_rack_cache` (`:113-132`) answers
a hash — `config.action_dispatch.rack_cache`, `true` meaning
`{ metastore: "rails:/", entitystore: "rails:/", verbose: false }` — after
requiring `action_dispatch/http/rack_cache`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb`, the
`rails:/` meta/entity stores over `Rails.cache`).

trails' `packages/trailties/src/application/default-middleware-stack.ts`
(`buildStack`) wires every other middleware in that method but has no
`Rack::Cache`: the rack-cache gem is not ported, and there is no
`action_dispatch/http/rack_cache` port. `config.actionDispatch.rackCache`
exists (`packages/trailties/src/trailties/action-dispatch.ts`) and is ignored.

## Acceptance criteria

- [ ] `load_rack_cache` is ported as a private `loadRackCache` on
      `DefaultMiddlewareStack`, with Rails' `true` → default-hash arm.
- [ ] `buildStack` mounts `Rack::Cache` at Rails' position (after `Static`,
      before `Rack::Lock`) when `loadRackCache()` answers a value — which
      needs a rack-cache port (npm client or port, async from the start) and
      the `rails:/` stores from `action_dispatch/http/rack_cache.rb`.
