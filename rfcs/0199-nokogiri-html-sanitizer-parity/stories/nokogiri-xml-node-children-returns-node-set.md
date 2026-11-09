---
title: "XML::Node#children returns a NodeSet"
status: draft
updated: 2026-11-09
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`XmlNode#children` (`packages/nokogiri/lib/xml/node.ts`, `get children`) returns `XmlNode[]`. Rails' `Node#children` is native and returns an `XML::NodeSet` (`vendor/nokogiri/v1.18.3/ext/nokogiri/xml_node.c`, `rb_xml_node_children`), and `coerce` returns `fragment(data).children` / `data.children` directly (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/node.rb:1562-1567`). Because of the array, `coerce` wraps both arms in `new NodeSet(this.document, …)`, and `DocumentFragment`'s context arm wraps `DocumentFragment.parse(...).children` the same way (`packages/nokogiri/lib/xml/document-fragment.ts`). Surfaced in trails#9891 review.

## Acceptance criteria

- [ ] `XmlNode#children` returns a `NodeSet` over the node's document.
- [ ] `coerce`'s DocumentFragment and String arms return `data.children` / `this.fragment(data).children` unwrapped, and the `DocumentFragment` context arm drops its wrap.
- [ ] Callers that read `children` as an array are converged.
