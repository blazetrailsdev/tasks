---
title: "local-variable-accepts-a-symbol-as-option"
status: draft
updated: 2026-09-28
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

`ObjectRendering#local_variable`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/abstract_renderer.rb:43-52`) accepts
`as:` as either a String or a Symbol. It validates `as.to_s` against `/\A[a-z_]\w*\z/` and
returns `as.to_sym`.

trails' `localVariable` (`packages/actionview/src/renderer/abstract-renderer.ts:142`) validates
the raw value. So the trails spelling of a Ruby Symbol, `":customer"` (the leading colon is
kept, per CLAUDE.md), raises `The value (:customer) of the option \`as\` is not a valid Ruby
identifier`. The Symbol arm is dropped.

`render_test.rb` `test_render_partial_collection_as_by_symbol` cannot be ported into
`packages/actionview/src/template/render.test.ts` (added in trails#8236) until this is fixed.

## Acceptance criteria

- `localVariable` accepts `as: ":customer"`, strips the Symbol colon before validating, and
  binds the `customer` local.
- `render partial collection as by symbol` is ported into `template/render.test.ts`.
