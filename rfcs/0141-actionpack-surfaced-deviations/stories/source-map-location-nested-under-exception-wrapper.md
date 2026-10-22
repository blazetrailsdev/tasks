---
title: "Seat SourceMapLocation as ExceptionWrapper::SourceMapLocation"
status: draft
updated: 2026-10-22
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails nests `SourceMapLocation` inside `ExceptionWrapper`:
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb`
(`class SourceMapLocation < DelegateClass(Thread::Backtrace::Location)` inside
`class ExceptionWrapper`). Rails tests reach it as
`ActionDispatch::ExceptionWrapper::SourceMapLocation`
(`vendor/rails/v8.0.2/actionview/test/template/render_test.rb:224`).

trails declares it as a top-level class in
`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:28`,
and trails#9239 exported it flat from `packages/actionpack/src/action-dispatch/index.ts`
so that `packages/actionview/src/template/render.test.ts` could import
`SourceMapLocation` directly.

## Acceptance criteria

- `SourceMapLocation` is seated as the nested constant `ExceptionWrapper.SourceMapLocation`
  (a static on `ExceptionWrapper`, or `rbModConstSet(ExceptionWrapper, "SourceMapLocation", ...)`).
- The flat export from `action-dispatch/index.ts` is removed.
- The three render tests in `render.test.ts` construct it as
  `new ExceptionWrapper.SourceMapLocation(erbBtl, ex.template)`.
- `parity:api:extra:gate` and the call gates stay green.
