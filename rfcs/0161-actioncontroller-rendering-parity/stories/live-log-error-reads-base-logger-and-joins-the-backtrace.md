---
title: "Live#log_error reads ActionController::Base.logger, keeps the annotated_source_code arm and joins the backtrace"
status: draft
updated: 2026-10-11
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Live#log_error`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb:394-405`):

```ruby
def log_error(exception)
  logger = ActionController::Base.logger
  return unless logger

  logger.fatal do
    message = +"\n#{exception.class} (#{exception.message}):\n"
    message << exception.annotated_source_code.to_s if exception.respond_to?(:annotated_source_code)
    message << "  " << exception.backtrace.join("\n  ")
    "#{message}\n\n"
  end
end
```

trails' `logError` (`packages/actionpack/src/action-controller/metal/live.ts`,
the `export function logError` above the `Live` module) differs in three ways:

- it reads `this.logger`, the controller instance's logger, not
  `ActionController::Base.logger`;
- it drops the `annotated_source_code` arm entirely;
- it interpolates `err.stack` (which already repeats the name and message) where
  Rails joins `exception.backtrace` with `"\n  "`, and it invents `?? "Error"` /
  `String(exception)` fallbacks.

Seen while porting `live_stream_test.rb:592-651` in trails#8783: those tests
only `assert_match` a substring of the log, so they pass on the divergent body.

## Acceptance criteria

- `logError` reads `ActionController.Base.logger`, returns when it is nil, and
  builds the message in Rails' three steps: class and message, the
  `annotatedSourceCode` arm behind `rbObjRespondTo`, then the backtrace joined
  with `"\n  "` through the repo's backtrace idiom.
- No fallback Rails does not have.
- `pnpm parity:api:calls` shows no row for `live.rb` `log_error`.
