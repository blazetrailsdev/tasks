---
title: "default-middleware-stack-ssl-and-debug-exceptions-args"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

Rails' `DefaultMiddlewareStack#build_stack`
(`vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb`)
passes two middlewares arguments trails' `buildStack`
(`packages/trailties/src/application/default-middleware-stack.ts`) does not:

- `::ActionDispatch::SSL, **config.ssl_options, ssl_default_redirect_status: config.action_dispatch.ssl_default_redirect_status`
  (`:25-26`) — trails passes `config.sslOptions` alone.
- `::ActionDispatch::DebugExceptions, app, config.debug_exception_response_format`
  (`:63`) — `DebugExceptions#initialize(app, routes_app = nil, response_format = :default, interceptors = ...)`
  (`actionpack/lib/action_dispatch/middleware/debug_exceptions.rb`), while
  trails' constructor is `(app, options: DebugExceptionsOptions = {})`
  (`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts:50`)
  and the stack passes `{ responseFormat }`, dropping `routes_app`.

## Acceptance criteria

- [ ] `DebugExceptions`' constructor takes Rails' positional
      `(app, routesApp = null, responseFormat = ":default", interceptors = …)`,
      and `buildStack` passes `this.app, config.debugExceptionResponseFormat`.
- [ ] `buildStack` passes `sslDefaultRedirectStatus` from
      `config.actionDispatch.sslDefaultRedirectStatus` into SSL's options.
- [ ] `application.test.ts`'s "passes DebugExceptions the configured response
      format" asserts the Rails argument list.
