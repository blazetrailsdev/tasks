---
title: "show-exceptions-render-exception-follows-rails"
status: done
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8966
claim: "2026-10-16T00:52:08Z"
assignee: "debug-view-extends-action-view-base-and-renders-rescue-templates"
blocked-by: null
closed-reason: null
---

## Context

`ShowExceptions#render_exception`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/show_exceptions.rb:48-65`)
renders on `request.dup`, sets headers through `request.path_info=` /
`request_method=`, and its `rescue Exception => failsafe_error` writes
`"Error during failsafe response: ..."` to `$stderr` and returns a body that
includes the administrator sentence. trails'
`packages/actionpack/src/action-dispatch/middleware/show-exceptions.ts` uses an
invented `failsafeResponse(_wrapper)` that writes nothing and returns only
`"500 Internal Server Error\n"`, mutates and restores the env in a `finally`,
and hand-rolls `fallbackToHtmlFormatIfInvalidMimeType`. Surfaced on trails#8960:
`show_exceptions_test.rb:147-155` swaps `$stderr` for a `StringIO`, which the
port does not need because nothing is written.

## Acceptance criteria

- `renderException` follows `show_exceptions.rb:48-65`, with the `$stderr` puts
  and Rails' failsafe body; `failsafeResponse` is gone.
- `fallbackToHtmlFormatIfInvalidMimeType` follows Rails (`request.content_mime_type` rescue).
- The failsafe test captures `$stderr` as Rails does.
