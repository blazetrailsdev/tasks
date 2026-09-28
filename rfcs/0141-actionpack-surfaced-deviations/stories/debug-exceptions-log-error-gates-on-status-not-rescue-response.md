---
title: "DebugExceptions#log_error gates on statusCode < 500 instead of wrapper.rescue_response?"
status: in-progress
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8209
claim: "2026-09-28T02:00:53Z"
assignee: "authentication-generator-cookie-session-end-to-end"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::DebugExceptions#log_error`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:135-139`):

```ruby
return unless logger
return if !log_rescued_responses?(request) && wrapper.rescue_response?
```

skips logging only for exceptions listed in `ExceptionWrapper.rescue_responses`
(i.e. `wrapper.rescue_response?`, `exception_wrapper.rb`).

trails' `logError` (`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts`)
guards with `wrapper.statusCode < 500` instead, so an exception mapped to a 5xx
rescue response (e.g. `ActionController::NotImplemented` → 501) is logged where
Rails skips it, and an unlisted 4xx-status exception is skipped where Rails logs it.
`ExceptionWrapper#rescueResponse()` already exists (`middleware/exception-wrapper.ts`).

Surfaced in trails#8148 (not part of `debug-exceptions-logger-follows-request-logger-chain`,
which covers the logger / level / `log_rescued_responses?` reads, not this guard).

## Converged shape

`if (!this.isLogRescuedResponses(request) && wrapper.rescueResponse()) return;`

## Acceptance criteria

- [ ] `logError` gates on `wrapper.rescueResponse()`, not the status code.
- [ ] A test: a 501-mapped rescue response is not logged when
      `action_dispatch.log_rescued_responses` is false; an unmapped error is.
- [ ] `debug-exceptions` tests green.
