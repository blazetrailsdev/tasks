---
title: "Port RouteWrapper#endpoint's app.dispatcher? branch and rack_app"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RouteWrapper#endpoint` (`vendor/rails/actionpack/lib/action_dispatch/routing/inspector.rb:44-46`)
is:

```ruby
def endpoint
  app.dispatcher? ? "#{controller}##{action}" : rack_app.inspect
end
```

trails' port (`packages/actionpack/src/action-dispatch/routing/inspector.ts`,
`RouteWrapper#endpoint`) calls neither `app` nor `dispatcher?`: it branches on
`route.isRedirect` / `route.redirectTarget` and then formats
`` `${controller}#${action}` `` unconditionally, so a mounted Rack app prints
`controller#action` where Rails prints `rack_app.inspect`. `rack_app`
(`inspector.rb:48-50`) and `SimpleDelegator`-shaped `app` are both unported.

The blocker is that the route's app is not reachable from the wrapper. Rails'
`Journey::Route#app` is the endpoint the mapper built (`mapper.rb:294-303`);
after PR #7368 trails builds the `Dispatcher` per route on the `RouteSet`
(`RouteSet#_dispatcher`), keyed by the `Route`, because the `DispatcherRegistry`
the dispatcher consults is a property of the set. `Route#app` is only the
`mount`ed Rack app, so `RouteWrapper` has no `app` to ask `dispatcher?`.

The omission carries a `@missingRailsCall app, dispatcher?` receipt pointing at
this story.

## Acceptance criteria

- `RouteWrapper#endpoint` calls `app` and `dispatcher?` the way
  `inspector.rb:44-46` does, and `rack_app` (`inspector.rb:48-50`) is ported.
- A route that mounts a Rack app prints the app rather than `#`.
- The `@missingRailsCall app, dispatcher?` receipt on `endpoint` is deleted.
