---
title: "Port Engine.endpoint and drop the RackApp wrapper in Application#endpoint"
status: in-progress
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: 7305
claim: "2026-08-31T17:10:47Z"
assignee: "wire-implicit-render-into-controller-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`Application#endpoint` (`packages/trailties/src/application.ts`) ports
`vendor/rails/railties/lib/rails/engine.rb:527-529`:

```ruby
def endpoint
  self.class.endpoint || routes
end
```

Two deviations:

- `self.class.endpoint` — the class-level `endpoint` attribute
  (`engine.rb:406-408`, `class_attribute :endpoint`) is not ported, so the
  trails method always answers the route set and an engine cannot be mounted
  at a custom Rack endpoint.
- Rails hands the `RouteSet` itself to `MiddlewareStack#build` because it
  responds to `call`; trails' `RackApp`
  (`actionpack/src/action-dispatch/middleware/stack.ts`) is a function type,
  so the port returns `(env) => routes.call(env)`.

## Acceptance criteria

- `Engine.endpoint` exists as a class-level accessor per `engine.rb:406`,
  and `Application#endpoint` returns it when set, else `routes()`.
- The stack accepts a `call`-bearing object (or the wrapper is justified at
  the call site as the language-forced shape) so a mounted endpoint reaches
  `MiddlewareStack#build` unchanged.
- A test mounts a custom endpoint and asserts it terminates the stack.
