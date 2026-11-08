---
title: "nokogiri-xml-document-fragment-instance-methods"
status: draft
updated: 2026-11-08
rfc: "0199-nokogiri-html-sanitizer-parity"
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

`DocumentFragment` (`packages/nokogiri/lib/xml/document-fragment.ts`) does not port the libxml `DocumentFragment#dup` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document_fragment.rb:112-121`), nor `to_s` / `to_html` / `to_xhtml` / `to_xml` / `css` / `search` / `fragment` on the fragment (`:123-200`). `XmlNode#dup` (`xml/node.rb`) is also unported.

## Acceptance criteria

- [ ] `DocumentFragment#dup` ported (needs `Document#dup` and `Node#dup(level, new_document)`).
- [ ] The remaining `DocumentFragment` instance methods ported with their Rails tests.
