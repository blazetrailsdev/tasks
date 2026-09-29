---
title: "ExceptionWrapper#traces stringifies the trace Rails keeps as a Location"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
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

`ExceptionWrapper#traces` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:153-179`)
builds each entry as `{ exception_object_id:, id:, trace: trace }`, where `trace` is the
cleaned backtrace element itself. That element is a `Thread::Backtrace::Location`, or a
String once a cleaner filter has run.

trails (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`,
`get traces`) sets `trace: String(trace)`, and `TraceWithId.trace` is typed `string`.
After trails#8236 the wrapper memoizes `Location`s, so this is the one place that still
stringifies them. It was kept because `DebugExceptions#renderForApiRequest` serializes
`traces` into the JSON/XML error body, and the HTML templates read `trace` as text.

## Acceptance criteria

- `traces` stores the cleaned element (`BacktraceLine | string`) as Rails does.
- The templates and `renderForApiRequest` call `to_s` on it where they emit it, matching
  Rails' `_trace.html.erb` interpolation and the API body's string traces.
- The `#traces returns every trace by category enumerated with an index` test compares
  against `wrapper.fullTrace` directly.
