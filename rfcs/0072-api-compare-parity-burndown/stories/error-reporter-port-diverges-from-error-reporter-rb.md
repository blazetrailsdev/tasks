---
title: "ErrorReporter is ported method-by-method against error_reporter.rb"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6302
claim: "2026-08-09T21:39:14Z"
assignee: "parse-year-fragment-loses-exactness-past-max-safe-integer"
blocked-by: null
closed-reason: null
---

## Context

PR #6282 wired `ActiveSupport.errorReporter`
(`vendor/rails/activesupport/lib/active_support.rb:104-105`) so Deprecation's
`:report` behavior could reach it. The `ErrorReporter` it points at
(`packages/activesupport/src/error-reporter.ts`) is an early port that diverges
from `vendor/rails/activesupport/lib/active_support/error_reporter.rb`
throughout:

- `report(error, opts)` takes an options object; Rails takes kwargs with
  `severity: handled ? :warning : :error` and validates against
  `SEVERITIES` (`:26`, `:205-212`), raising `ArgumentError` otherwise. The port
  validates nothing.
- Rails marks the error and walks `error.cause`
  (`:239-245`) so a re-report of a wrapped error is suppressed; the port uses a
  `WeakSet` on the top-level error only.
- `unexpected` (`:145-154`) is `severity: :warning`, `source: DEFAULT_SOURCE`,
  and raises `UnexpectedError` under `debug_mode`; the port hardcodes
  `severity: "error"`, `source: "unexpected"` and has no `debug_mode` or
  `UnexpectedError`.
- `disable` (`:180-192`) scopes through `IsolatedExecutionState` (already
  ported at `isolated-execution-state.ts`); the port swaps the subscriber array.
- `set_context` (`:198-200`) delegates to `ActiveSupport::ExecutionContext`
  (ported at `execution-context.ts`); the port keeps a private hash, so context
  set through either surface is invisible to the other.
- `initialize(*subscribers, logger: nil)` (`:34-38`) — the port's constructor
  takes nothing.
- The subscriber-error rescue logs through `logger.fatal` with Rails' message
  (`:224-231`); the port calls `logger.error` with its own string.

## Converged shape

Port `error_reporter.rb` method by method against the vendored source, reusing
the already-ported `ExecutionContext` and `IsolatedExecutionState`. Likely
splits into two stories (report/subscribe/context core, then
handle/record/unexpected); size it when claiming.

## Acceptance criteria

- [ ] `report` matches `error_reporter.rb:205-247`: kwarg defaults, `SEVERITIES`
      validation, `ExecutionContext.toH()` merge, `cause` walk.
- [ ] `setContext` and `disable` route through `ExecutionContext` /
      `IsolatedExecutionState`.
- [ ] `unexpected` matches `:145-154` including `debugMode` and `UnexpectedError`.
- [ ] `error_reporter_test.rb`'s cases are ported, not the current bespoke set.
