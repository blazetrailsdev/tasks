---
title: "nokogiri: XML::Document extends XML::Node"
status: done
updated: 2026-11-26
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10790
claim: "2026-11-26T10:14:47Z"
assignee: "nokogiri-gumbo-fragment-context-form-walk-and-encoding"
blocked-by: null
closed-reason: null
---

## Context

Rails: `class Document < Nokogiri::XML::Node` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document.rb`), so `xml?` (`xml/node.rb:1219-1221`), `type`, `to_s` and the rest of `Node` reach a Document by inheritance. trails' `XmlDocument` (`packages/nokogiri/lib/xml/document.ts`) is a standalone class; trails#10748 copied `isXml` onto it by hand (`XmlDocument.prototype.isXml = XmlNode.prototype.isXml`) and reads its C type through a private `_ptr` cast on libxml2-wasm's document.

## Acceptance criteria

- `XmlDocument extends XmlNode`, its `_node` the libxml document node; the hand copy of `isXml` is deleted.
- `type` is the inherited `XmlNode#type`, reading `pointerId`; no `_ptr` cast remains.
