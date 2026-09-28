---
title: "Port the exception middleware's missing members, DebugView's parent and three arity rows"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "debug-exceptions-log-error-gates-on-status-not-rescue-response",
    "exception-wrapper-backtrace-returns-memoized-locations",
    "remote-ip-get-ip-reads-env-not-request-readers",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Under `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/`,
`pnpm parity:api --package actiondispatch` reports:

- `debug_exceptions.rb` 15/17: `render_for_browser_request(request, wrapper)`
  (`:78`) and `create_template(request, wrapper)` (`:116`), the private split of
  `render_exception`
- `debug_view.rb` 7/8: `DebugView#render(*)` (`:48`); and
  `class DebugView < ActionView::Base` (`:11`) has no parent in trails
- `exception_wrapper.rb` 60/61: `spot(exc)` (`:239`)
- `remote_ip.rb` 7/8: `GetIp#filter_proxies(ips)` (`:191`)

Three arity rows: `DebugLocks#render_details(req)` (`debug_locks.rb:49`),
`HostAuthorization::DefaultResponseApp#response_body(request)`
(`host_authorization.rb:100`) and `SSL#build_hsts_header(hsts)` (`ssl.rb:122`)
— trails takes `()`, `(request, format)` and `()` respectively.

`pnpm parity:api:extra` lists novel `statusText` and `toResponse` on
`middleware/exception-wrapper.ts`, which Rails has as `Rack::Utils::HTTP_STATUS_CODES`
lookups inside `DebugExceptions` / `PublicExceptions`.

## Acceptance criteria

- Each missing member exists with Rails' body; `DebugView` extends
  `ActionView::Base` (it is a view, and renders the rescue templates through the
  view layer).
- The three arity rows are gone: the methods take Rails' parameters and derive
  the rest as Rails does.
- `statusText` / `toResponse` are gone.
- `pnpm parity:api` reports the four files at 100% with no arity or inheritance
  row.
