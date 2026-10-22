---
title: "Nokogiri XML NodeSet union by pointer and root-namespace default"
status: in-progress
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9227
claim: "2026-10-22T16:21:27Z"
assignee: "actionview-assertion-gate-enrollment"
blocked-by: null
closed-reason: null
---

## Context

trails#9062 made `XML::Document` / `XML::Node` (`packages/nokogiri/src/xml/document.ts`, `xml/node.ts`) answer `css` through libxml2-wasm XPath. Two gaps remain against Nokogiri:

- `NodeSet#plus` (`packages/nokogiri/src/xml/node-set.ts`) dedups by `x._node === node._node`. libxml2-wasm's `createNode` builds a new wrapper for every lookup, so two XML result sets holding the same node are never deduped. Nokogiri's `NodeSet#|` / `#+` (C-level `xml_node_set.c` `set_union`) compares node pointers, and `Node#==` is `pointer_id == other.pointer_id` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/node.rb`).
- `extract_params` defaults `ns ||= document.root&.namespaces || {}` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/searchable.rb:223`). `extractParams` in `packages/nokogiri/src/xml/searchable.ts` defaults to `{}`, and `XmlNode` has no `namespaces`.

## Acceptance criteria

- [ ] Union of XML node sets dedups the same underlying libxml node, compared by pointer identity as in Nokogiri.
- [ ] `extractParams` defaults `ns` to `document.root.namespaces`, with `XML::Node#namespaces` ported.
- [ ] Tests cover both cases.
