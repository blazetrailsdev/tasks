---
title: "Deprecation's :report behavior reports through a ported ActiveSupport.errorReporter"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6282
claim: "2026-08-09T15:40:10Z"
assignee: "mysql-schema-creation-quoted-columns-reimplements-the-delegated-decoration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `DEFAULT_BEHAVIORS` in PR #6279.

Rails' `:report` behavior (`activesupport/lib/active_support/deprecation/behaviors.rb:48-52`)
builds a `DeprecationException`, sets its backtrace from the callstack, and
hands it to `ActiveSupport.error_reporter.report(error)`:

```ruby
report: ->(message, callstack, deprecator) do
  error = DeprecationException.new(message)
  error.set_backtrace(callstack.map(&:to_s))
  ActiveSupport.error_reporter.report(error)
end
```

trails has no port of `ActiveSupport::ErrorReporter`
(`activesupport/lib/active_support/error_reporter.rb`) and no
`ActiveSupport.error_reporter` accessor
(`activesupport/lib/active_support.rb:105-107`), so PR #6279's ported entry is
an empty callable — the only DEFAULT_BEHAVIORS entry that does nothing where
Rails does something. `deprecation_test.rb`'s `:report_error behavior` is
correspondingly reduced to "does not throw".

## Converged shape

The `:report` entry is Rails' three lines verbatim, against a ported
`ActiveSupport.errorReporter`. That accessor and enough of `ErrorReporter` for
`report(error)` to reach a subscriber is the bulk of the work; the behavior
entry itself is three lines.

## Acceptance criteria

- [ ] `ActiveSupport.errorReporter` exists and `report` reaches subscribers.
- [ ] `DEFAULT_BEHAVIORS`' `:report` entry is `behaviors.rb:48-52` verbatim.
- [ ] `deprecation_test.rb`'s `:report_error behavior` asserts the reported
      error, not merely that `warn` did not throw.
