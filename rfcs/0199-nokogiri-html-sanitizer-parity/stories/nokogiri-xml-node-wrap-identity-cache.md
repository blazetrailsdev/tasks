---
title: "nokogiri-xml-node-wrap-identity-cache"
status: ready
updated: 2026-11-28
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`noko_xml_node_wrap` (`vendor/nokogiri/v1.19.7/ext/nokogiri/xml_node.c`) returns the Ruby object cached in `node->_private`, so every read of the same C node answers the same `Nokogiri::XML::Node`. trails' `XmlNode` wrappers are built fresh at each site (`packages/nokogiri/lib/xml/node.ts` `children`, `parent`; `document.ts` `createElement`, `createTextNode`). Only `XmlDocument#root` memoizes, keyed by `pointerId` (trails#10845), which goes stale if libxml reuses a freed root's address. Raised in review of trails#10845.

## Acceptance criteria

- [ ] One pointer-to-wrapper table, in the spirit of `node->_private`, backs every `XmlNode` wrap, and `doc.root.children.first()` answers the same object on repeated reads.
- [ ] `XmlDocument#root`'s own memo is removed in favour of that table.
