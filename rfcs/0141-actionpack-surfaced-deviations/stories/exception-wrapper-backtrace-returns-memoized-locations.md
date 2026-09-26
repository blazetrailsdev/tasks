---
title: "ExceptionWrapper#backtrace is rebuilt per read and stringifies non-template Locations"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds the wrapper's backtrace once, in `initialize`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:58`,
`@backtrace = build_backtrace`), and exposes it through `attr_reader :backtrace`
(`:252`). `build_backtrace` (`:255-273`) returns the exception's
`backtrace_locations`: each is a `Thread::Backtrace::Location`, or a
`SourceMapLocation` (`:233-250`, a `DelegateClass(Thread::Backtrace::Location)`)
for a frame in a compiled template.

trails (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`),
after trails#8137:

- `backtrace()` calls `buildBacktrace()` on every read, where Rails memoizes it.
- `buildBacktrace` iterates `excBacktraceLocations` (ruby-compat's `Location`),
  but its non-template arm returns `loc.toS()`, a string, where Rails returns
  `loc`. `BacktraceLine` is `string | SourceMapLocation`, and `SourceMapLocation`
  `extends String`.
- The consumers are string-shaped. `cleanBacktrace` filters on
  `String(l).includes("node_modules")`, and `traces` checks membership with
  `applicationTrace.includes(trace)`. The `.includes` check only works because
  strings compare by value across two separate `buildBacktrace` calls. With
  unmemoized `Location` objects it would fail on identity.

## Converged shape

- `@backtrace` is built once in the constructor, as `exception_wrapper.rb:58`
  does, and `backtrace` is a reader over it.
- `buildBacktrace` returns `loc` itself (a `Location`) for a non-template frame.
  `BacktraceLine` becomes `Location | SourceMapLocation`, and `SourceMapLocation`
  delegates to its `Location` rather than extending `String`.
- `cleanBacktrace`, `traces`, `extractSource` and `extractFileAndLineNumber`
  read `path` / `lineno` / `label` / `toS()` off the location, as Rails'
  `backtrace_cleaner.clean_locations` path and `source_extracts` do.

## Acceptance criteria

- `buildBacktrace` has no `loc.toS()` arm; it returns `loc`.
- `backtrace()` is memoized at construction.
- `exception-wrapper.test.ts` and `debug-exceptions*.test.ts` stay green.
