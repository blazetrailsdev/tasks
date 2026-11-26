---
title: "nokogiri-xml-document-new-version-and-wrap"
status: ready
updated: 2026-11-26
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::XML::Document.new(version = "1.0", *rest)` (`vendor/nokogiri/v1.18.3/ext/nokogiri/xml_document.c:456-468`) calls `xmlNewDoc(version)` and wraps the result with `noko_xml_document_wrap_with_init_args`. trails' `XmlDocument` constructor (`packages/nokogiri/lib/xml/document.ts`) takes a raw `cDocument` pointer, which defaults to `xmlNewDoc()` with no version. libxml2-wasm binds `_xmlNewDoc` with no arguments, so libxml falls back to "1.0". `readMemory` passes its parsed pointer to the same constructor, where Rails calls `noko_xml_document_wrap`.

## Acceptance criteria

- `new XmlDocument(version = "1.0")` hands `version` to `xmlNewDoc`, and the `@missingRailsArgs xmlNewDoc` receipt is deleted.
- The parse path wraps its pointer without going through the public `version` constructor.
