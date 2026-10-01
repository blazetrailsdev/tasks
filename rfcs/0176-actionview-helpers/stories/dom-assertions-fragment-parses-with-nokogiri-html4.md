---
title: "DomAssertions#fragment is a regex tokenizer, not Nokogiri::HTML4::DocumentFragment (dom_assertions.rb:131)"
status: blocked
updated: 2026-09-30
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 7
pr: null
claim: "2026-09-30T23:30:33Z"
assignee: "test-fixture-accessors-are-untyped"
blocked-by: "libxml2-wasm (0.7.1 pinned, 0.7.2 latest) is built without libxml2's HTML module: its raw bindings export _xmlCtxtReadMemory but no htmlReadMemory/htmlCreateMemoryParserCtxt, so Nokogiri::HTML4::DocumentFragment cannot be backed by it. Needs either a custom libxml2 wasm build with LIBXML_HTML_ENABLED or a decision to wrap an npm HTML parser (see html5-sanitizer-vendor-over-nokogiri-html5 / request-encoder-html-response-parser-returns-raw-body, which propose parse5); both exceed the no-new-runtime-deps rule of the bundle it was claimed in."
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
