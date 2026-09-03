---
title: "tse-compiler-preserves-template-line-numbers"
status: draft
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
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

`wire-template-spot-to-exception-wrapper` ported `Template#spot`
(`packages/actionview/src/template.ts`, per
`vendor/rails/actionview/lib/action_view/template.rb:231-246`) and gave
`Template#translateLocation` its Rails caller —
`ExceptionWrapper::SourceMapLocation#spot`
(`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`, per
`vendor/rails/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:232-250`),
fed by a `build_backtrace` that now walks `PathRegistry.allResolvers()` /
`builtTemplates()` exactly as `exception_wrapper.rb:254-275` does.

The remaining gap is one level down, in the compiler. Rails' ERB compiler emits
compiled source whose LINE NUMBERS ALIGN with the template's, which is the
precondition `Template::Handlers::ERB#translate_location`
(`actionview/lib/action_view/template/handlers/erb.rb:64-84`) is written
against: it indexes `source.lines[backtrace_location.lineno - 1]`. trails'
`Tse` compiler emits a wrapper prelude plus a single-expression body, so a
frame inside a 3-line template reports `<anonymous>:13`, and
`translateLocation` (`template/handlers/tse-translate-location.ts:206`) bails
with `lines.length < backtraceLocation.lineno` — returning `null`, which
`Template#translateLocation` turns back into the untranslated compiled-source
spot.

Observable today in
`packages/actionpack/src/action-dispatch/dispatch/exception-wrapper.trails.test.ts`:
the template frame IS remapped onto a `SourceMapLocation` and DOES get a
spot-derived source extract, but the extract's lines come from the compiled
JS, not from the `.tse` source.

## Acceptance criteria

- The `Tse` compiler emits compiled source whose line numbers align with the
  template's, as ERB's does.
- A `.tse` template that raises reports a line inside the template — the
  third acceptance criterion `wire-template-spot-to-exception-wrapper` could
  not satisfy.
- The `exception-wrapper.trails.test.ts` cover is tightened from "has a
  spot-derived extract" to "the extract quotes the template source".
