---
title: "builder-template-handler-and-actionpack-builder-fixtures"
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

`Handlers.extended` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers.rb:12-18`)
registers five handlers. trails' `Template` `static {}` block
(`packages/actionview/src/template.ts:95-102`) registers four: `raw`, `tse`,
`html` and `:ruby`. `Builder`
(`actionview/lib/action_view/template/handlers/builder.rb`) is neither
registered nor recorded in `SKIP_GROUPS`. `port-html-builder-and-ruby-template-handlers`
(trails#8135) closed without deciding it.

Because the handler is missing, the actionpack test fixtures
(`port-actionpack-view-and-helper-test-fixtures`) left out all nine `.builder`
templates under `vendor/rails/v8.0.2/actionpack/test/fixtures/`:
`functional_caching/formatted_fragment_cached.xml.builder`,
`functional_caching/xml_fragment_cached_with_html_partial.xml.builder`,
`layouts/builder.builder`, `respond_to/using_defaults.xml.builder`,
`respond_to/using_defaults_with_type_list.xml.builder`,
`test/hello_xml_world.builder`, `test/implicit_content_type.atom.builder` and
`old_content_type/render_default_for_builder.builder`. Their consumers are
`caching_test.rb`, `render_test.rb`, `respond_to_test.rb` and
`content_type_test.rb`.

Builder's DSL is `xml.p "..."` / `xml.body do ... end` over the `builder`
gem's `XmlMarkup` (method_missing per tag).

## Acceptance criteria

- Port `ActionView::Template::Handlers::Builder` at
  `packages/actionview/src/template/handlers/builder.ts` and register it as
  `builder`. Base it on an `XmlMarkup` port or an npm XML builder, not an
  invented DSL. Otherwise record it in `SKIP_GROUPS` with the reason.
- If ported: add the nine `.builder` fixtures above to
  `packages/actionpack/src/test-helpers/fixtures/`, with their bodies in the
  trails Builder spelling, plus a test rendering one of them.
