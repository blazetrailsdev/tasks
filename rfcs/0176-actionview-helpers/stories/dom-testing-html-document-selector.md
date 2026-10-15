---
title: "dom-testing-html-document-selector"
status: closed
updated: 2026-10-15
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
closed-reason: "FALSIFIED: Testing.htmlDocument and HTML5.Document shipped in trails#8947 itself."
---

## Context

`Rails::Dom::Testing.html_document(html_version: nil)`
(`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing.rb:19-24`) picks
`Nokogiri::HTML4::Document` / `HTML5::Document` through `choose_html_parser`, and
`ActionView::TestCase::Behavior#document_root_element`
(`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb:333`) calls it.
trails#8947 ported `Testing` in `packages/actionview/src/testing.ts` with
`htmlDocumentFragment` only: `@blazetrails/nokogiri` exports
`HTML5.DocumentFragment` and no `HTML5.Document` / `HTML4.Document`.

## Acceptance criteria

- [ ] `@blazetrails/nokogiri` exports `HTML5.Document` (parse5 `parse`).
- [ ] `Testing.htmlDocument({ htmlVersion = null })` is ported beside
      `htmlDocumentFragment`, routed through the module-private `chooseHtmlParser`.
- [ ] `ActionView::TestCase`'s `document_root_element` reads it.
