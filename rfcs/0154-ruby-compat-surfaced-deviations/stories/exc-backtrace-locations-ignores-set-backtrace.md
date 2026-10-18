---
title: "excBacktraceLocations reads frames set_backtrace wrote; MRI answers nil"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On an exception that was never raised, MRI 3.3.11 answers `backtrace_locations` with `nil` even after
`set_backtrace(["a"])`: `exc_set_backtrace` stores only `bt` (`vendor/ruby/v3.3.11/error.c:1833`),
and `exc_backtrace_locations` reads `bt_locations` (`error.c:1789`). Checked with ruby:
`f = RuntimeError.new; f.set_backtrace(["a"]); f.backtrace_locations # => nil`.

trails' `excSetBacktrace` (`packages/ruby-compat/src/backtrace-location.ts`) rewrites `exc.stack`, and
`excBacktraceLocations` parses `stack`, so it answers `[]` (and a Location per `at` line) instead of `nil`.

## Acceptance criteria

- `excBacktraceLocations` answers nil for an exception whose frames came only from `excSetBacktrace` and that was never raised, as MRI does.
- `excBacktraceLocations` after a raise followed by `set_backtrace` still answers the raise-time locations.
- Each case is checked against ruby 3.3.11.
