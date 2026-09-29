---
title: "TagBuilder generates element methods via define_element; the Proxy keeps only method_missing"
status: done
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8235
claim: "2026-09-28T22:31:02Z"
assignee: "generated-app-pnpm-test-finds-no-tests"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TagHelper::TagBuilder` generates one method per HTML element at load time:
`define_element`, `define_void_element` and `define_self_closing_element`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb:50-79`). They emit
`tag_string(...)` or `self_closing_tag_string(...)` bodies. Only an unknown name reaches
`method_missing` (`:324-330`), which dasherizes it and calls `tag_string`. `respond_to_missing?`
(`:320-322`) answers true.

trails' `TagBuilder` (`packages/actionview/src/helpers/tag-helper.ts`, `createTagBuilderProxy`)
is a Proxy whose `get` trap handles every element through its own argument parsing, with separate
void and self-closing arms. trails#8177 routed its block arms through `tagString`. But the
static `defineElement`, `defineVoidElement` and `defineSelfClosingElement` only register names in
`VOID_ELEMENTS` / `SELF_CLOSING_ELEMENTS` / `METHOD_TO_TAG_NAME`. They define no method.

## Converged shape

- `defineElement` / `defineVoidElement` / `defineSelfClosingElement` define prototype methods on
  `TagBuilder` whose bodies call `tagString` / `selfClosingTagString`, per `:50-79`, and they are
  invoked for Rails' element list (`:113-`).
- The Proxy is reduced to Rails' `method_missing` arm, for names with no generated method: dasherize,
  `ensure_valid_html5_tag_name`, `tag_string`. This is the `Proxy` row for `tag_helper.rb` in
  CLAUDE.md's `method_missing` table.

## Acceptance criteria

- `tag().div`, `tag().br` and `tag().svg` resolve to generated prototype methods, not the Proxy trap.
- `tag-helper.test.ts` stays green.
