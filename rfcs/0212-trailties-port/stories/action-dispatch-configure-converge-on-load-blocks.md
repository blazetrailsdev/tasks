---
title: "action-dispatch-configure-converge-on-load-blocks"
status: done
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9902
claim: "2026-11-09T03:08:50Z"
assignee: "action-dispatch-configure-converge-on-load-blocks"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/trailties/action-dispatch.ts` `action_dispatch.configure` diverges from
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/railtie.rb:54-75`:

- `ActionDispatch::ParamBuilder.ignore_leading_brackets = app.config.action_dispatch.ignore_leading_brackets` (`:58`) is not set
  (`packages/actionpack/src/action-dispatch/http/param-builder.ts:31` has the cattr).
- `ignore_accept_header` / `perform_deep_munge` are set directly instead of in
  `ActiveSupport.on_load(:action_dispatch_request)` (`:61-64`); `Request` already runs that hook
  (`packages/actionpack/src/action-dispatch/http/request.ts:910`), and `ignore_accept_header` is not set at all.
- `default_charset` / `default_headers` are not in `on_load(:action_dispatch_response)` (`:66-69`);
  `Response` runs no `action_dispatch_response` load hook (Rails: `action_dispatch/http/response.rb` bottom), and `default_headers` is never assigned.
- `always_write_cookie` defaulting (`:74`) should be checked as well.

## Acceptance criteria

- `action_dispatch.configure` mirrors `railtie.rb:54-75` line for line, including both `on_load` blocks.
- `Response` runs `run_load_hooks(:action_dispatch_response, Response)` as Rails does.
- Tests cover `ignore_leading_brackets` and `default_headers` reaching their classes.
