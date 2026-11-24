---
title: "nokogiri-libxml2-wasm-export-missing-c-functions"
status: draft
updated: 2026-11-24
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

libxml2-wasm 0.7.1 (`node_modules/libxml2-wasm/lib/libxml2raw.mjs`) exports no `_xmlNewDocFragment`, `_xmlParseInNodeContext`, `_xmlReadIO`, `_xmlXIncludeSetFlags` / `_xmlXIncludeProcessTreeFlags`, `_xmlCopyDoc` or `_xmlDocCopyNode`. Nokogiri's ext calls each: `DocumentFragment.native_new` (`ext/nokogiri/xml_document_fragment.c`), `Node#in_context` (`xml_node.c`, behind `xml/node.rb:1105-1160`), `Document.read_io` (`xml_document.c`), `process_xincludes` (`xml_node.c`, `node.rb:530-536`), `Document#dup` / `Node#dup` (`document_fragment.rb:112-121`). Blocks nokogiri-xml-document-fragment-native-new, nokogiri-xml-node-parse-in-context, nokogiri-libxml2-wasm-xinclude-flags-and-read-io and the `dup` half of nokogiri-xml-document-fragment-instance-methods.

## Acceptance criteria

- [ ] A libxml2-wasm release (upstream PR, or a vendored build) exports those six functions.
- [ ] `packages/nokogiri/lib/extension.ts` seats them on `Nokogiri.LibXml2`.
