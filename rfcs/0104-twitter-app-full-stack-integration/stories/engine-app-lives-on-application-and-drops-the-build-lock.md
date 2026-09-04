---
title: "Engine#app is declared on Application and drops @app_build_lock (engine.rb:515-524)"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while wiring `MiddlewareStackProxy` through `Engine#app` in PR #7497
(`railtie-configuration-app-middleware-and-generators-stubs`).

Rails declares `app` on `Engine`, not on `Application`
(`vendor/rails/railties/lib/rails/engine.rb:515-524`):

```ruby
# Returns the underlying Rack application for this engine.
def app
  @app || @app_build_lock.synchronize {
    @app ||= begin
      stack = default_middleware_stack
      config.middleware = build_middleware.merge_into(stack)
      config.middleware.build(endpoint)
    end
  }
end
```

`Application` inherits it and overrides only the private `build_middleware`
(`application.rb:644-646`). trails puts the whole method on `Application`
(`packages/trailties/src/application.ts`, `app()`), alongside `_app`,
`defaultMiddlewareStack()` and the `build_middleware_stack` alias
(`application.rb:558`) — so an `Engine` that is not an `Application` has no
`app()` at all, and `Engine#endpoint` (`engine.ts:130`, ported) has no caller.

Two separate divergences in the same body:

- **Placement.** `app`, `_app` and `default_middleware_stack`
  (`engine.rb:761-763`) belong on `Engine`. `Application` keeps only its
  `build_middleware` override and the `build_middleware_stack` alias.
- **The build lock.** `@app_build_lock` (`engine.rb:59`, a `Monitor` created in
  `Engine#initialize`) is dropped entirely: trails' `app()` is a bare
  `if (this._app) return this._app` memo with no double-checked lock. The
  `@app || ... @app ||=` double-check is Rails' shape and is what makes a
  concurrent first `app` call build the stack once.

## Converged shape

- `app()`, the `_app` memo and `defaultMiddlewareStack()` move to `Engine`
  (`packages/trailties/src/engine.ts`), in Rails' declaration order — `app` at
  `engine.rb:516`, `default_middleware_stack` in the private section beside
  `build_middleware` (`engine.rb:755-763`).
- `Application` keeps `buildMiddleware()` (`application.rb:644-646`) and
  `buildMiddlewareStack()` (the `application.rb:558` alias) and nothing else of
  this cluster.
- The `@app_build_lock` double-check is ported or, if JS's single-threaded
  event loop makes the monitor genuinely meaningless for this body, that is
  recorded with a receipt at the call site naming `engine.rb:59,517` — decide
  it once, here, rather than leaving the guard silently absent.

## Acceptance criteria

- [ ] `Engine#app` exists on `Engine` and a non-Application engine can serve
      through it.
- [ ] `Application` declares only `buildMiddleware` / `buildMiddlewareStack`
      from this cluster.
- [ ] The `@app_build_lock` question is answered in code — ported, or a
      receipt citing `engine.rb:59,517`.
