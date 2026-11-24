---
title: "nokogiri-xml-node-parse-in-context"
status: blocked
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
blocked-by: "waiting on nokogiri-libxml2-wasm-export-missing-c-functions (libxml2-wasm 0.7.1 lacks the C export)"
closed-reason: null
---

## Context

`DocumentFragment`'s constructor (`packages/nokogiri/lib/xml/document-fragment.ts`) ports `Nokogiri::XML::DocumentFragment#initialize` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document_fragment.rb:85-110`). Its context arm is `context.parse(tags, options)`, i.e. `Node#parse` (`xml/node.rb:1105-1160`) → `in_context` (`xmlParseInNodeContext`). trails ports neither `Node#parse` nor `in_context`, and libxml2-wasm exports no `xmlParseInNodeContext`, so the arm takes the no-context `<root>` wrapper parse and carries `@missingRailsCall parse — CONVERGEABLE nokogiri-xml-node-parse-in-context`.

## Acceptance criteria

- [ ] `XML::Node#parse` is ported (with `in_context`, via a libxml2-wasm build exporting `xmlParseInNodeContext` or equivalent).
- [ ] `DocumentFragment`'s context arm is `context.parse(tags, options)` and the receipt is deleted.
