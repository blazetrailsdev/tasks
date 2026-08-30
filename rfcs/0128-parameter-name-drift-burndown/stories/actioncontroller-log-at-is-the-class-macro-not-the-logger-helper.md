---
title: "actioncontroller log_at is the class macro, not the logger helper"
status: draft
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/metal/logging.ts` is the counterpart
of `vendor/rails/actionpack/lib/action_controller/metal/logging.rb`, but the two
`log_at`s in it are not the same method.

Rails' `ActionController::Logging::ClassMethods#log_at(level, **options)`
(`logging.rb:17`) is a class macro that installs an around_action:

```ruby
def log_at(level, **options)
  around_action ->(_, action) { logger.log_at(level, &action) }, **options
end
```

The `logger.log_at` it calls is a DIFFERENT method —
`ActiveSupport::LoggerThreadSafeLevel#log_at(level)`
(`vendor/rails/activesupport/lib/active_support/logger_thread_safe_level.rb:35`),
which swaps the level for the duration of the block.

trails ported only the second, and put it in the first's file:
`logging.ts:23`, `logAt(logger, level, fn)`. The ActionController macro itself is
unported — `createLogAtFilter(level)` (`logging.ts:38`) is the nearest thing and
is a trails invention with no Rails name. So the parameter-name check scores
Rails' `log_at(level, **options)` against the logger helper's
`(logger, level, fn)` and reports two renames that no spelling can fix; both are
held in [[param-drift-actioncontroller-structural-residue]].

## Converged shape

`logAt(level, options)` in `metal/logging.ts` is the class macro, installing an
around-action that calls the logger's own `logAt` — matching `logging.rb:17`
line for line, including the `**options` forwarding to `around_action`. The
level-swapping helper moves to `@blazetrails/activesupport` under
`logger-thread-safe-level.ts`, where `LoggerThreadSafeLevel#log_at` lives in
Rails, and `createLogAtFilter` disappears with it.

## Acceptance criteria

- `metal/logging.ts` declares the ClassMethods macro at Rails' name and
  signature; the level-swapping helper is in activesupport at its Rails file and
  name, and `createLogAtFilter` is gone.
- Both `metal/logging.rb#log_at` rows leave
  `output/param-name-mismatches.json`, and actioncontroller's mark is narrowed
  with `pnpm parity:api:params:tighten` (never rewritten upward).
- `pnpm parity:api:extra --package actioncontroller` loses the
  `createLogAtFilter` entry and gains no novel name.
- No test renamed; `parity:api:calls` and `parity:api:calls:args` no new row.
