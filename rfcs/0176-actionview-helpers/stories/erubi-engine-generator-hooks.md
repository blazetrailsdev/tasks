---
title: "Port ERB::Erubi's add_text/add_expression/add_code/add_postamble hooks over an Erubi::Engine-shaped TSE compiler"
status: closed
updated: 2026-10-18
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
closed-reason: "FALSIFIED: trails has no Erubi class; the bufvar test calls the TSE compiler directly (owner ruling on trails#9037)"
---

## Context

`packages/actionview/src/template/handlers/tse/erubi.ts` ports `ActionView::Template::Handlers::ERB::Erubi#initialize`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb/erubi.rb:11-27`) with `bufvar` / `preamble` and a
`src` reader, compiling through `compileJs` (`packages/tse-compiler/src/emit-js.ts`). Rails' class subclasses `::Erubi::Engine`
and overrides its generator hooks `add_text`, `add_expression`, `add_code`, `add_postamble` and the private
`flush_newline_if_pending` (`erubi.rb:30-82`). trails' `emit-js.ts` is a single `emit` loop with no such hooks, so
`parity:api` lists those 5 as missing on `template/handlers/erb/erubi.rb`, and `postamble` /
`freeze_template_literals` / `escapefunc` are not passed.

## Acceptance criteria

- [ ] The TSE compiler exposes Erubi::Engine-shaped hooks that `Erubi` overrides at the Rails names, so the
      `erubi.rb` row shows 0 missing.
- [ ] `postamble` defaults to `bufvar` as in Rails.
