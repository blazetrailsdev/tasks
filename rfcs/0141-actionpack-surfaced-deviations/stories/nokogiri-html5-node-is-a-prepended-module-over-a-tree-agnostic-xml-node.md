---
title: "nokogiri-html5-node-is-a-prepended-module-over-a-tree-agnostic-xml-node"
status: draft
updated: 2026-11-25
rfc: "0141-actionpack-surfaced-deviations"
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

Nokogiri prepends `HTML5::Node` onto `XML::Node`
(`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/node.rb`), so it is a small module
of overrides (`inner_html`, `write_to`, `fragment`). In `@blazetrails/nokogiri`,
`HTML5.Node` (`packages/nokogiri/lib/html5/node.ts:41`, ~630 lines) is a class
extending `XmlNode` that carries the whole parse5-backed node implementation,
while `XmlNode` (`packages/nokogiri/lib/xml/node.ts`) answers only for a libxml2
tree. Because the parse5 behaviour lives on the `HTML5.Node` class,
`HTML5.Document` cannot extend `XmlDocument` (story
`html5-document-extends-xml-document-chain`) without losing every node member.

## Acceptance criteria

- The parse5 tree handling moves under `XmlNode` (the node answers by its own
  backing tree, not by its class), so `XmlNode` serves both trees.
- `HTML5.Node` holds only the members `html5/node.rb` defines, and reaches
  `XmlNode` as a prepend does (`prepend()` from ruby-compat).
- `instanceof HTML5.Node` call sites (~26 across packages) are re-checked.
