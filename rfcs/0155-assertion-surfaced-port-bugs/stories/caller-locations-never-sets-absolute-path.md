---
title: "callerLocations never sets Location#absolute_path"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

Ruby's `Thread::Backtrace::Location#absolute_path` is the expanded file path, and it is
nil for code compiled by `eval` / `class_eval(src, file, line)`. Rails reads it first in
`extract_callstack`
(`vendor/rails/activesupport/lib/active_support/deprecation/reporting.rb:143-147`:
`path = frame.absolute_path || frame.path`), and `deprecation_test.rb:780-785` asserts
`@callstack.first.absolute_path == File.expand_path(__FILE__)`.

trails' `callerLocations` (`packages/activesupport/src/deprecation.ts`) builds each frame
with `path`, `lineno` and `label` only, so `absolutePath` is always undefined. The
converged test "warn deprecation skips the internal caller locations"
(`packages/activesupport/src/deprecation.test.ts`) therefore asserts
`callstack[0].absolutePath ?? callstack[0].path` where Rails asserts `absolute_path` alone.

## Converged shape

`callerLocations` sets `absolutePath` to the frame's resolved file path for frames that
come from a real module, stripping any `file://` prefix, and leaves it undefined for
`eval` / `new Function` frames (a V8 `at eval (...)` frame, or a `//# sourceURL=` unit).
That is the JS analogue of Ruby's nil `absolute_path` for eval'd code.

## Acceptance criteria

- [ ] `callerLocations` populates `absolutePath` for file frames and leaves it undefined
      for eval-compiled frames.
- [ ] The test asserts `callstack[0].absolutePath` directly, as Rails does.
- [ ] "warn deprecation can blame code generated with eval" still blames
      `/path/to/template.html.tse:2`.
