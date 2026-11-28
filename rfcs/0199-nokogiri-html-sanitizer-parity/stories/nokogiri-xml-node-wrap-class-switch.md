---
title: "nokogiri-xml-node-wrap-class-switch"
status: draft
updated: 2026-11-28
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

`noko_xml_node_wrap(rb_class, c_node)` (`vendor/nokogiri/v1.19.7/ext/nokogiri/xml_node.c:2393-2465`) picks `Element`, `Text`, `Attr`, `EntityReference`, `Comment`, `DocumentFragment`, `ProcessingInstruction`, `EntityDecl`, `CDATA`, `DTD`, `AttributeDecl`, `ElementDecl` or `Node` from `c_node->type` (`:2414-2454`). trails has no `XML::Element` / `Text` / `Comment` / `CDATA` subclasses, so `nokoXmlNodeWrap` (`packages/nokogiri/lib/xml/node.ts`, trails#10871) always builds a plain `XmlNode` and takes no `rbClass`.

## Acceptance criteria

- [ ] The XML node subclasses are ported at their nokogiri paths (`lib/nokogiri/xml/element.rb`, `text.rb`, `comment.rb`, `cdata.rb`, …).
- [ ] `nokoXmlNodeWrap` takes `rbClass` first and runs the type switch when it is null, as the C does.
- [ ] `createElement` / `createTextNode` / `createCdata` / `createComment` build `Element` / `Text` / `CDATA` / `Comment`.
