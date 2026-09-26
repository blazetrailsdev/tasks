---
title: "DebugExceptions#logger(request) and log_array follow Rails; drop invented logger/level options"
status: draft
updated: 2026-09-26
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

Rails' `DebugExceptions#logger(request)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:191-193`) is
`request.logger || ActionView::Base.logger || stderr_logger`. `log_rescued_responses?` (`:205-207`)
reads only `request.get_header("action_dispatch.log_rescued_responses")`, and `log_array` (`:180-188`)
reads the level only from `action_dispatch.debug_exception_log_level`, then calls `logger.add(level, ...)`.
The level can also carry the formatter's `tags_text`.

trails' `packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts` (after trails#8147)
differs in three ways:

- `logError` inlines the lookup, adding a `rack.logger` header, a constructor `logger` option, and no
  `ActionView::Base.logger` arm. There is no `logger(request)` method.
- `isLogRescuedResponses` and `logArray` fall back to the invented constructor options
  `logRescuedResponses` / `logLevel`.
- `logArray` dispatches to `logger.warn/info/error` instead of `logger.add(level, …)`, and does not
  handle `tags_text`.

## Acceptance criteria

- Port `logger(request)` with Rails' three arms, reading `ActionView::Base.logger` through the
  zero-import `TopLevel` seat, per CLAUDE.md § "Call-time constant resolution".
- `logError` calls it, and returns early when it answers nil, as Rails does.
- `logArray` calls `logger.add(level, lines.join("\n" + tagsText))` per `:180-188`.
- The `logger` / `logLevel` / `logRescuedResponses` constructor options and the `rack.logger` read
  are removed, and callers and tests set the request headers instead.
