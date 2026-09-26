---
title: "simple-type-new-nil-raises-no-method-error"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
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

Rails' `SimpleType#initialize` is `@symbol = symbol.to_sym`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/types.rb:29-31`), so
`SimpleType[nil]` raises `NoMethodError` (undefined method `to_sym` for nil).
trails' `SimpleType` constructor (`packages/actionview/src/template/types.ts`)
answers `:null` for a null symbol (`` `:${symbol}` ``).

`Template#type` is now `Template.Types.get(this.format)` unguarded
(`template.rb:292-294`, trails#8157), so a null-format template under the
standalone `SimpleType` yields a `SimpleType(":null")` where Rails raises.
Rails' actionview tests always load `action_controller`
(`actionview/test/abstract_unit.rb:20`), so Rails exercises only the `Mime[nil]`
arm there, which answers nil. Making the constructor raise reds about 29 trails
tests in `template.test.ts`, `base.test.ts`, `rendering.test.ts`,
`template.trails.test.ts` and `dependency-tracker.trails.test.ts`. They build
templates with no `format:`, where Rails' `new_template` always passes
`format: :html` (`template_test.rb`).

## Acceptance criteria

- `new SimpleType(null)` raises `NoMethodError` ("undefined method 'to_sym' for nil"), per `types.rb:30`.
- The trails tests that build format-less templates pass `format: ":html"` as Rails' `new_template` does.
