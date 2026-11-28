---
title: "nokogiri-libxml2-wasm-encode-special-chars"
status: draft
updated: 2026-11-27
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps:
  - nokogiri-libxml2-wasm-export-missing-c-functions
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

`XML::Node#content=` (`vendor/nokogiri/v1.19.7/lib/nokogiri/xml/node.rb:487-489`) calls `encode_special_chars`, which in C is `xmlEncodeSpecialChars(node->doc, string)` (`vendor/nokogiri/v1.19.7/ext/nokogiri/xml_node.c:821-836`). libxml2-wasm 0.7.1 does not export `xmlEncodeSpecialChars`, so `packages/nokogiri/lib/xml/node.ts` `encodeSpecialChars` replaces `& < > " \r` in JS and carries `@missingRailsCall xmlEncodeSpecialChars`.

## Acceptance criteria

- [ ] `encodeSpecialChars` calls libxml2's `xmlEncodeSpecialChars` (a libxml2-wasm binding, or one seated in `lib/extension.ts`), and the `@missingRailsCall` receipt is deleted.
