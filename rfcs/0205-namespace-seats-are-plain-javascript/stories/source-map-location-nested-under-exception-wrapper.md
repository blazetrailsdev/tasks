---
title: "Seat SourceMapLocation as ExceptionWrapper::SourceMapLocation"
status: in-progress
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9411
claim: "2026-10-28T16:19:26Z"
assignee: "call-gate-credits-typed-fetch-on-plain-object-config-receivers"
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

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
