---
title: "DomAssertions keeps html_version: and routes through Rails::Dom::Testing.html_document_fragment"
status: done
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8947
claim: "2026-10-15T18:30:59Z"
assignee: "key-read-receiver-unread-port-body-rows-converge"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Dom::Testing::Assertions::DomAssertions#assert_dom_equal` / `assert_dom_not_equal` take `html_version: nil` and pass it to `fragment(text, html_version:)`, which calls `Rails::Dom::Testing.html_document_fragment(html_version:)` (rails-dom-testing v2.2.0 `lib/rails/dom/testing/assertions/dom_assertions.rb:131-133`, `lib/rails/dom/testing.rb` `html_document_fragment` / `choose_html_parser`, with `default_html_version` as an `mattr_accessor`).

trails#8933 ported `fragment` in `packages/actionview/src/testing/dom-assertions.ts` as a direct call to `HTML5.DocumentFragment.parse` (from `@blazetrails/nokogiri`, backed by parse5). It dropped the `htmlVersion` keyword and the `Testing.htmlDocumentFragment` indirection.

## Acceptance criteria

- `assertDomEqual` / `assertDomNotEqual` / `fragment` take `{ strict, htmlVersion = null }` in Rails' order.
- `Rails::Dom::Testing` is ported with `defaultHtmlVersion`, `isHtml5Support`, `htmlDocumentFragment` and `chooseHtmlParser`, with the same arms and error messages. The `:html4` arm raises `NotImplementedError` until an HTML4 fragment exists.
