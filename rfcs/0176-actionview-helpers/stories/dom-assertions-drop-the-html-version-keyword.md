---
title: "assertDomEqual / assertDomNotEqual drop html_version: fragment cannot select the HTML4 or HTML5 parser"
status: draft
updated: 2026-10-02
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails PR 8406.

rails-dom-testing's `assert_dom_equal` / `assert_dom_not_equal` take an
`html_version:` keyword and pass it to `fragment`
(`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/dom_assertions.rb:35-38,68-71`),
and `fragment(text, html_version: nil)` hands it to
`Rails::Dom::Testing.html_document_fragment(html_version:)` (`:132-135`), which
picks `Nokogiri::HTML4::DocumentFragment` or `HTML5::DocumentFragment`, defaulting
to `default_html_version` (`lib/rails/dom/testing.rb:12,26-30`).

trails' port (`packages/actionview/src/testing/dom-assertions.ts`) declares
`assertDomEqual(expected, actual, message = null, { strict = false } = {})`: there
is no `htmlVersion` key, `fragment(text)` takes one argument, and there is no
`htmlDocumentFragment` / `defaultHtmlVersion`. A caller cannot select the parser,
and an unknown `html_version` does not raise the `ArgumentError` Rails raises
(`testing.rb:36-43`).

Both parsers are the missing piece: this depends on
`dom-assertions-fragment-parses-with-nokogiri-html4` for HTML4, and HTML5 has no
story yet.

## Acceptance criteria

- `assertDomEqual` / `assertDomNotEqual` accept `htmlVersion` and pass it to
  `fragment`, whose signature is `fragment(text, { htmlVersion = null })`.
- `fragment` goes through a port of `Rails::Dom::Testing.html_document_fragment`,
  with `default_html_version` and the `ArgumentError` for an unsupported version
  (`testing.rb:26-43`).
- The `parity:api` arity / option-key rows for both assertions match
  `dom_assertions.rb:35,68`.
