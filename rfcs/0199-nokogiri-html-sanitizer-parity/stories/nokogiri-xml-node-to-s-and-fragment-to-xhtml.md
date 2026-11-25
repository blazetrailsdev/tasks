---
title: "nokogiri-xml-node-to-s-and-fragment-to-xhtml"
status: in-progress
updated: 2026-11-25
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: trails#10748
claim: "2026-11-25T15:14:41Z"
assignee: "nokogiri-libxml2-wasm-export-missing-c-functions"
blocked-by: null
closed-reason: null
---

## Context

trails#(this bundle) ported `XML::DocumentFragment#to_s` / `to_html` / `to_xml` / `css` / `search` / `serialize` / `fragment` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document_fragment.rb:123-217`) and `Document#fragment` (`xml/document.rb:429-431`). Still missing: `to_xhtml` (needs `NodeSet#to_xhtml` / `Node#to_xhtml`), `XML::Node#to_s` (`node.rb`, `document.xml? ? to_xml : to_html`, so an XML fragment's `toString` prints `[object Object]`), and xpath over a fragment of a rootless `Document.new` (Searchable reads `document.root`). The Rails tests `test_xml_fragment_has_multiple_toplevel_children`, `test_xml_fragment_has_outer_text`, `test_fragment_search_three_ways`, `test_fragment_search_with_multiple_queries` (`test/xml/test_document_fragment.rb:76-200`) are unported because of these.

## Acceptance criteria

- [ ] `XML::Node#to_s`, `#to_xhtml`, `NodeSet#to_xhtml` and `DocumentFragment#to_xhtml` ported.
- [ ] The four tests above ported to `packages/nokogiri/test/xml/document-fragment.test.ts` and passing.
