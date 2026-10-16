---
title: "exception-wrapper-extract-source-drops-null-path-guard"
status: done
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8982
claim: "2026-10-16T16:15:26Z"
assignee: "exception-wrapper-extract-source-drops-null-path-guard"
blocked-by: null
closed-reason: null
---

## Context

`ExceptionWrapper#extract_source`'s non-spot arm
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:316-321`)
calls `source_fragment(file, line_number)` unguarded: an MRI
`Thread::Backtrace::Location#path` is always a String. trails'
`extractSource` (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`)
guards `file == null ? null : this.sourceFragment(...)`, because ruby-compat's
`BacktraceLocation` (`packages/ruby-compat/src/backtrace-location.ts:44-46`)
answers a null `path` for a V8 frame with no file position
(`at new Promise (<anonymous>)`, `eval at ...`). The arm carries
`@inventedArm if — CONVERGEABLE` pointing here.

## Acceptance criteria

- Either `BacktraceLocation#path` answers a String for every frame MRI would
  (e.g. the frame text, as MRI's cfunc frames inherit the caller path), or
  `sourceFragment` absorbs a null path the way Rails' `source_fragment`
  answers `nil` — so `extractSource` drops the invented guard.
- The `@inventedArm if` receipt on `extractSource` is removed.
