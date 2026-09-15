---
title: "DebugExceptions passes ActionDispatch::Request, not the Rack env, to interceptors, logging and the HTML render"
status: draft
updated: 2026-09-15
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `DebugExceptions#call` (`actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:40-44`) builds `request = ActionDispatch::Request.new env` once. It passes that request to `invoke_interceptors`, where each interceptor is called as `interceptor.call(request, exception)`, and to `render_exception`, `log_error` and the templates.

trails, after blazetrailsdev/trails#7777, builds the `Request` in `call` and negotiates on it. Everything else still takes the raw `RackEnv`, in `packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts`:

- `Interceptor = (env: RackEnv, exception: Error) => void`;
- `invokeInterceptors(request: RackEnv, …)`;
- `logError(request: RackEnv, …)` and `isLogRescuedResponses(request: RackEnv)`;
- `renderHtmlError(wrapper, env)`.

The review of #7777 raised this. It was left out because `Interceptor` is a public type, and changing its argument breaks every registered interceptor.

## Acceptance criteria

- `Interceptor` receives the `Request`, matching `interceptor.call(request, exception)`.
- `invokeInterceptors`, `logError`, `isLogRescuedResponses` and the HTML render take the `Request`, reading headers through it (`request.getHeader(...)`).
- Rails-named tests in `debug-exceptions.test.ts` are updated to pass a `Request`.

## Definition of done

No `RackEnv` parameter remains on DebugExceptions' methods other than `call`.

## Verification

`pnpm vitest run packages/actionpack/src/action-dispatch/dispatch/debug-exceptions`
