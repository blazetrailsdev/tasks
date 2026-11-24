---
title: "nokogiri-xml-document-fragment-instance-methods"
status: blocked
updated: 2026-11-24
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps:
  - nokogiri-libxml2-wasm-export-missing-c-functions
  - nokogiri-xml-node-to-s-and-fragment-to-xhtml
deps-rfc: []
est-loc: null
priority: null
pr: trails#10698
claim: "2026-11-24T15:52:37Z"
assignee: "nokogiri-html5-document-fragment-gumbo-fragment"
blocked-by: "dup waits on nokogiri-libxml2-wasm-export-missing-c-functions; to_xhtml on nokogiri-xml-node-to-s-and-fragment-to-xhtml (partial port in trails#10698)"
closed-reason: null
---

## Context

`DocumentFragment` (`packages/nokogiri/lib/xml/document-fragment.ts`) does not port the libxml `DocumentFragment#dup` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document_fragment.rb:112-121`), nor `to_s` / `to_html` / `to_xhtml` / `to_xml` / `css` / `search` / `fragment` on the fragment (`:123-200`). `XmlNode#dup` (`xml/node.rb`) is also unported.

## Acceptance criteria

- [ ] `DocumentFragment#dup` ported (needs `Document#dup` and `Node#dup(level, new_document)`).
- [ ] The remaining `DocumentFragment` instance methods ported with their Rails tests.
