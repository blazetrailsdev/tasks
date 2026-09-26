---
title: "DebugExceptions passes ActionDispatch::Request, not the Rack env, to logging and the HTML render"
status: in-progress
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8147
claim: "2026-09-26T16:22:41Z"
assignee: "lookup-context-locale-detail-follows-i18n"
blocked-by: null
closed-reason: null
---

## Context

Rails' `DebugExceptions#call` (`actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:40-44`) builds `request = ActionDispatch::Request.new env` once. It passes that request to `invoke_interceptors`, where each interceptor is called as `interceptor.call(request, exception)`, and to `render_exception`, `log_error` and the templates.

trails, after blazetrailsdev/trails#7777, builds the `Request` in `call`, negotiates on it, and passes it to interceptors. The rest still takes the raw `RackEnv`, in `packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts`:

- the backtrace cleaner, read as `env["action_dispatch.backtrace_cleaner"]` instead of `request.get_header` (`debug_exceptions.rb:40-41`);
- `logError(request: RackEnv, …)` and `isLogRescuedResponses(request: RackEnv)` (`:58`);
- `renderHtmlError(wrapper, env)`.

The review of #7777 raised this.

## Acceptance criteria

- The backtrace cleaner lookup, `logError`, `isLogRescuedResponses` and the HTML render take the `Request`, reading headers through it (`request.getHeader(...)`).
- Rails-named tests in `debug-exceptions.test.ts` are updated to pass a `Request`.

## Definition of done

No `RackEnv` parameter remains on DebugExceptions' methods other than `call`.

## Verification

`pnpm vitest run packages/actionpack/src/action-dispatch/dispatch/debug-exceptions`
