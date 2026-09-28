---
title: "Polymorphic routes dispatch to post_path, but named route helpers are defined as postPath"
status: ready
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found re-verifying the README quickstart (trails#8195) on `main` at `bace3edab4`.
In a scaffolded app (with the separately filed `persisted` / ivar issues worked around),
every model-based URL fails:

```text
linkTo("Show this post", post)  -> TypeError: Cannot read properties of undefined (reading 'call')
                                    at HelperMethodBuilder.handleModelCall (polymorphic-routes.ts:320)
formWith({ model: post })        -> ArgumentError: undefined route helper posts_path
                                    at HelperMethodBuilder.polymorphicMethod (polymorphic-routes.ts:272)
```

`HelperMethodBuilder#getMethodForString` builds the Rails method name
`${prefix}${str}_${suffix}` (`packages/actionpack/src/action-dispatch/routing/polymorphic-routes.ts:369`),
for example `post_path`, and then looks it up on the target (`:270`, `:295`, `:304`, `:321`),
the port of `public_send` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/polymorphic_routes.rb:265-285`).
But `NamedRouteCollection` defines the helpers camelCased: `camelize(`${name}\_path`, "lower")`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:566-567`, `:615-616`), so the
target has `postPath`, not `post_path`. The scaffold templates themselves call `postsPath()`,
`editPostPath(...)`.

## Acceptance criteria

- The name polymorphic routes dispatch to is the same spelling `NamedRouteCollection`
  defines. For example, `getMethodForString` returns the camelCased name, per the
  `_path` / `_url` rule in `docs/ruby-ts-conventions.md`. Every `target[method]` site uses it.
- Tests cover `polymorphicPath(record)`, `polymorphicUrl(record)`, `linkTo(name, record)` and
  `formWith({ model })` against a RouteSet with `resources("posts")`, for a persisted and a
  new record.
