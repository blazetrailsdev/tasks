---
title: "exception-wrapper-clean-backtrace-passes-kind-to-cleaner"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::ExceptionWrapper#clean_backtrace`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:283-289`)
passes `backtrace` and the kind to `backtrace_cleaner.clean`. With no cleaner, it returns
the full backtrace for every kind.

trails' `cleanBacktrace` (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`)
works differently. It first partitions the lines on `String(l).includes("node_modules")`,
which Rails does not do. It then calls `backtraceCleaner.clean(partitioned.map(String))`
without passing the kind. So without a cleaner, `application_trace` and `framework_trace`
are split on a heuristic Rails does not have, and with a cleaner the kind is dropped.

The same file also exposes `get sourceLocation()`, which has no Rails counterpart. It backs
`fileName()` / `lineNumber()`.

Found while converging `exception-wrapper-backtrace-returns-memoized-locations` (trails#8236).
That PR left the partition in place. `converge-exception-wrapper-traces-partition` is closed,
but the partition survives.

## Acceptance criteria

- `cleanBacktrace(args)` is `backtraceCleaner ? backtraceCleaner.clean(backtrace, args) : backtrace`,
  as `exception_wrapper.rb:283-289` is. The cleaner's `clean` accepts Locations and calls
  `to_s` on each, as `backtrace_cleaner.rb:139-160` does.
- The `node_modules` partition is gone. The `#application_trace` / `#framework_trace` tests
  build a cleaner with a silencer, as `exception_wrapper_test.rb` does.
- `sourceLocation` is removed or receipted.
