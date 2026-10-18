---
title: "Nokogiri XML::Document and XML::Node include Searchable"
status: draft
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
closed-reason: null
---

## Context

`assertDomEncoded` / `assertSelectEncoded` are ported in `packages/actionview/src/testing/selector-assertions.ts`
(`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/selector_assertions.rb:250-266`). Their Rails tests,
"feed item encoded" and "feed item encoded with html version"
(`vendor/rails-dom-testing/v2.2.0/test/selector_assertions_test.rb:266-354`), build the document with `render_xml`,
i.e. `Nokogiri::XML::Document.parse`, and then `assert_select` over it. trails' `XmlDocument` / `XmlNode`
(`packages/nokogiri/src/xml/document.ts`, `xml/node.ts`) are libxml-backed and do not include `Searchable`
(`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/node.rb` includes `Searchable`), so `css` is missing and the two tests are parked
as `it.skip` in `packages/actionview/src/testing/selector-assertions.test.ts`.

## Acceptance criteria

- [ ] `XML::Document` / `XML::Node` answer `css` / `atCss` through `Searchable`, with `cdata?`, `blank?`, `content`.
- [ ] "feed item encoded" runs; the `:html5` arms of "feed item encoded with html version" run, the `:html4` arms stay
      parked per CLAUDE.md "DOM testing is HTML5 only".
