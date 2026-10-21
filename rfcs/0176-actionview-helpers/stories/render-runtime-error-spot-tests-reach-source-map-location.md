---
title: "render-runtime-error-spot-tests-reach-source-map-location"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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

`render runtime error`, `render location conditional append` and
`render location conditional append 2`
(`vendor/rails/v8.0.2/actionview/test/template/render_test.rb:218-255`) are
still `it.skip` in `packages/actionview/src/template/render.test.ts` after
`tse-undefined-local-raises-template-error` (the undefined name now raises,
trails#9161). Each test takes `ex.backtrace_locations.first`, wraps it in
`ActionDispatch::ExceptionWrapper::SourceMapLocation.new(erb_btl, ex.template)`
and asserts on `spot(ex.cause)[:first_column]` (6, 8, an Integer). The fixtures
are `test/runtime_error.html.erb` and `test/unparseable_runtime_error{,_2}.html.erb`,
which call the undefined `method_that_does_not_exist`.

Blockers:

- `SourceMapLocation` lives in `packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:28`,
  and actionview cannot depend on actionpack (actionpack imports actionview).
- The test-time compiler (`packages/actionview/src/test-helpers/compile-template.ts`)
  evaluates transpiled source, so the first backtrace location must name the
  template's compiled line/column for `Template#spot` (`template.ts:226`) and
  `translateLocation` to answer Rails' columns.

## Acceptance criteria

- [ ] The three fixtures exist as `.tse` under actionview's test fixtures.
- [ ] The three tests are un-skipped with Rails' assertions, reaching `SourceMapLocation#spot` (or its actionview-side body without a workspace cycle).
