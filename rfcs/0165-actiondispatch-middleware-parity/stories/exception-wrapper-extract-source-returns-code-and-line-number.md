---
title: "exception-wrapper-extract-source-returns-code-and-line-number"
status: in-progress
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8980
claim: "2026-10-16T15:14:52Z"
assignee: "exception-wrapper-extract-source-returns-code-and-line-number"
blocked-by: null
closed-reason: null
---

## Context

`ExceptionWrapper#extract_source` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:295-322`)
returns `{ code:, line_number: }`. trails' `extractSource`
(`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`) returns
`{ file, line, code? }` (`SourceExtract = TraceEntry & { code? }`), so the ported
rescue templates (`middleware/templates/rescues/_source.{html,text}.tse`) read
`sourceExtract.line` where Rails reads `source_extract[:line_number]`.

## Acceptance criteria

- `extractSource` returns `{ code, lineNumber }` as `exception_wrapper.rb:295-322` does, with no `file` key.
- `_source.html.tse` / `_source.text.tse` read `sourceExtract.lineNumber`.
- `sourceLocation` / `lineNumber()` callers that relied on the `TraceEntry` shape are converged.
