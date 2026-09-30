---
title: "DomAssertions#fragment is a regex tokenizer, not Nokogiri::HTML4::DocumentFragment (dom_assertions.rb:131)"
status: draft
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Dom::Testing::Assertions::DomAssertions#fragment` parses both sides with `Nokogiri::HTML4::DocumentFragment`: `vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/dom_assertions.rb:131-133`, and `lib/rails/dom/testing.rb` `html_document_fragment`.

trails#8268 ported `DomAssertions` into `packages/actionview/src/testing/dom-assertions.ts`. The workspace has no HTML parser (`@blazetrails/nokogiri` wraps libxml2-wasm's XML parser only), so `fragment` there is a regex tokenizer. It covers what the actionview suites reach:

- lowercased names
- entity-decoded values and text, for a small named-entity table
- void and `/>` elements
- comments

It does not do libxml2 HTML4's implied end tags (e.g. `<p>` closing an open `<p>`), its full entity table, or its whitespace/text-node normalization. The same gap blocks `ActionDispatch` `htmlDocument` (`packages/actionpack/src/action-dispatch/testing/assertions.ts`: "HTML parsing (rails-dom-testing) is not yet implemented").

## Converged shape

Add HTML4 document-fragment parsing to `@blazetrails/nokogiri` (libxml2's `htmlReadMemory` / `htmlCreateMemoryParserCtxt`, as `Nokogiri::HTML4::DocumentFragment` uses). Then make `fragment` in `dom-assertions.ts` call it, and delete the tokenizer (`TOKEN`, `ATTRIBUTE`, `VOID_ELEMENTS`, `ENTITIES`, `decodeEntities`).

## Acceptance criteria

- `fragment` returns a Nokogiri-shaped HTML4 fragment, and `compareDoms` walks its nodes, `attribute_nodes` and `to_s` as `dom_assertions.rb:73-129` does.
- The six migrated actionview suites and `dom-assertions.trails.test.ts` stay green.
