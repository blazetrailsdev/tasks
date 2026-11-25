---
title: "html5-document-extends-xml-document-chain"
status: ready
updated: 2026-11-25
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps:
  - nokogiri-html5-node-is-a-prepended-module-over-a-tree-agnostic-xml-node
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

Nokogiri's chain is `HTML5::Document < HTML4::Document < XML::Document < XML::Node` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/document.rb`, `html4/document.rb`, `xml/document.rb`), and `HTML5::Node` is a module prepended onto `XML::Node`. In `@blazetrails/nokogiri`, `XmlDocument` (`packages/nokogiri/lib/xml/document.ts`) has no superclass, `HTML5.Node` (`html5/node.ts`) is a class extending `XmlNode`, and `HTML5.Document` extends `HTML5.Node`. trails#10243 made an `HTML5.Document` answer `instanceof XmlDocument` through `XmlDocument[Symbol.hasInstance]`, receipted `CONVERGEABLE` against this story.

Changing `Document extends Node` to `extends XmlDocument` fails today on every node-returning member (`root`, `atCss`, `atXpath`, `document`) and on the backing tree (`_node` is a parse5 document there and a libxml2 one in `XmlDocument`).

## Acceptance criteria

- `XmlDocument extends XmlNode`, and `HTML5.Document` extends `XmlDocument` (through an `HTML4.Document` if one is ported). `HTML5.Node`'s members reach it as Ruby's prepend does.
- `XmlDocument[Symbol.hasInstance]` is deleted.
- `XML::DocumentFragment`'s constructor picks its backing tree from the document's own tree, not from the class.
