---
title: "Nokogiri HTML5::Node and XML::Node share one class chain"
status: draft
updated: 2026-11-11
rfc: "0219-actiontext-port"
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

In nokogiri, `HTML5::Node` is a module prepended onto `XML::Node` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/node.rb`), so there is one Node class. trails has two: the parse5-backed `packages/nokogiri/lib/html5/node.ts` `Node` and the libxml2-backed `packages/nokogiri/lib/xml/node.ts` `XmlNode`. Because of that split, `HTML5::DocumentFragment` (`lib/html5/document-fragment.ts`) extends `XML::DocumentFragment` through a type-level cast (`_XmlDocumentFragment`, receipted `@noRailsEquivalent CONVERGEABLE nokogiri-html5-node-is-xml-node`) that drops `_node` / `document` / `children` / `css` / `atCss` / `errors` from the base type. The runtime chain is real. The XML constructor also allocates an unused libxml2 root per HTML5 fragment.

## Acceptance criteria

- HTML5 nodes and XML nodes share one class chain, or `XmlNode`'s member types admit the HTML5 node, so the `_XmlDocumentFragment` cast is deleted with its receipt.
- An HTML5 fragment no longer allocates a libxml2 document.
