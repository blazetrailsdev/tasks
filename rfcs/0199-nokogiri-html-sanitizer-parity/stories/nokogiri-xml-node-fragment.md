---
title: "nokogiri-xml-node-fragment"
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

`XmlNode#coerce` (`packages/nokogiri/lib/xml/node.ts`) ports `Nokogiri::XML::Node#coerce` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/node.rb:1567`). Its String arm is `fragment(data).children`, and `Node#fragment` builds an `XML::DocumentFragment` parsed in the node's context (`xml/document_fragment.rb`, `ctx.parse` → `in_context`). trails ports neither `XML::DocumentFragment` nor `Node#fragment`, and libxml2-wasm exports no `xmlParseInNodeContext`, so the arm parses `<root>…</root>` through `XmlDocument.parse` and reads `/root/node()` — the no-context arm of `DocumentFragment#initialize`. It carries `@missingRailsCall fragment — CONVERGEABLE nokogiri-xml-node-fragment`.

## Acceptance criteria

- [ ] `XML::DocumentFragment` and `XML::Node#fragment` are ported, and `coerce`'s String arm is `this.fragment(data).children`.
- [ ] The receipt is deleted.
