---
title: "StreamingTemplateRenderer::Body#log_error logs exception.class, keeps respond_to?/to_s and joins Exception#backtrace"
status: done
updated: 2026-10-12
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#8824
claim: "2026-10-12T17:13:59Z"
assignee: "controller-class-render-is-typed-on-base"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::StreamingTemplateRenderer::Body#log_error`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/streaming_template_renderer.rb:30-38`):

```ruby
def log_error(exception)
  logger = ActionView::Base.logger
  return unless logger

  message = +"\n#{exception.class} (#{exception.message}):\n"
  message << exception.annotated_source_code.to_s if exception.respond_to?(:annotated_source_code)
  message << "  " << exception.backtrace.join("\n  ")
  logger.fatal("#{message}\n\n")
end
```

trails' `logError` (`packages/actionview/src/renderer/streaming-template-renderer.ts`,
the private method on `Body`) differs the way `Live#log_error` did before
trails#8821:

- it interpolates `error.name`, which is `"Error"` for a subclass that does not
  set `name`, where Rails interpolates `exception.class`;
- it probes `annotatedSourceCode` with `typeof ... === "function"` and
  `String(... ?? "")` where Rails calls `respond_to?` and `to_s`;
- it rebuilds the backtrace from `error.stack.split("\n").slice(1)` where Rails
  joins `exception.backtrace`;
- it invents an `exception instanceof Error ? exception : new Error(String(exception))`
  arm and a `(error.stack ?? "")` fallback Rails does not have.

The converged shape is the one trails#8821 gave
`packages/actionpack/src/action-controller/metal/live.ts` `logError`:
`rbObjClassname(exception)`, `rbObjRespondTo(exception, "annotatedSourceCode")`
with `toS(...)`, and `excBacktrace(exception)!.join("\n  ")` (ruby-compat,
`Exception#backtrace`, `vendor/ruby/v3.3.11/error.c:1741`).

## Acceptance criteria

- `logError` takes the exception as Rails does, returns when
  `ActionView.Base.logger` is nil, and builds the message in Rails' three
  steps with `rbObjClassname`, `rbObjRespondTo` + `toS`, and `excBacktrace`.
- No `instanceof Error` wrapping arm and no `?? ""` fallback.
- A test logs a subclass of `Error` and asserts its own class name and a
  `"\n  "`-joined backtrace; it fails on the current body.
- `pnpm parity:api:calls` shows no row for `streaming_template_renderer.rb`
  `log_error`.
