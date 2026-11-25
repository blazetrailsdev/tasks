---
title: "nokogiri-xml-read-memory-honours-recover"
status: done
updated: 2026-11-25
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10698
claim: "2026-11-24T15:52:37Z"
assignee: "nokogiri-html5-document-fragment-gumbo-fragment"
blocked-by: null
closed-reason: null
---

## Context

`XML::Document.read_memory` (`vendor/nokogiri/v1.18.3/ext/nokogiri/xml_document.c`, `noko_xml_document_s_read_memory`) hands the parse options to `xmlReadMemory`, so `DEFAULT_XML`'s `RECOVER` bit lets libxml2 build a tree from a document with a namespace error (an undeclared prefix such as `<app:edited>`) and record the error in `doc.errors`.

trails' `XmlDocument.readMemory` (`packages/nokogiri/lib/xml/document.ts`) calls `LibXml2.XmlDocument.fromString(string)` and ignores `options`; on any `XmlParseError` it leaves `_root` null, so `doc.root` throws "Document has no root". Passing `{ option: options }` was tried: libxml2-wasm 0.7.1 still throws.

Surfaced by `packages/actionview/test/template/atom-feed-helper.test.ts` ("feed should allow overriding ids", "feed xhtml"; Rails `actionview/test/template/atom_feed_helper_test.rb:311-341`), whose feeds emit `entry.tag!('app:edited', ...)` without declaring `xmlns:app`.

## Acceptance criteria

- [ ] `XmlDocument.readMemory` honours `ParseOptions#recover?`: a recoverable error yields a document with a root and the error in `errors`.
- [ ] The two `it.skip`s in `atom-feed-helper.test.ts` are unparked and pass.
