---
title: "nokogiri-xml-document-fragment-native-new"
status: claimed
updated: 2026-11-24
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps:
  - nokogiri-libxml2-wasm-export-missing-c-functions
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-24T15:52:37Z"
assignee: "nokogiri-html5-document-fragment-gumbo-fragment"
blocked-by: null
closed-reason: null
---

## Context

`DocumentFragment` (`packages/nokogiri/lib/xml/document-fragment.ts`) ports `DocumentFragment.new` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document_fragment.rb:41-45`), whose `native_new(document)` allocates an `XML_DOCUMENT_FRAG_NODE` in `document` (`xmlNewDocFragment`). libxml2-wasm exports no `xmlNewDocFragment`, so the constructor allocates a `<root>` element in a fresh libxml document instead, receipted `@inventedArm createRoot — CONVERGEABLE nokogiri-xml-document-fragment-native-new`.

## Acceptance criteria

- [ ] The fragment's native node is a real document-fragment node owned by `document`.
- [ ] The receipt is deleted.
