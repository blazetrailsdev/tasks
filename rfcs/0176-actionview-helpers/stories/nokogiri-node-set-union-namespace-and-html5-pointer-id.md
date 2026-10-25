---
title: "Nokogiri NodeSet union: namespace nodes by libxml2 merge rule, integer pointer_id for HTML5 nodes"
status: in-progress
updated: 2026-10-25
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9313
claim: "2026-10-25T21:18:44Z"
assignee: "cache-fragment-name-awaits-nested-relation-keys"
blocked-by: null
closed-reason: null
---

## Context

trails#9227 made `NodeSet#plus` (`packages/nokogiri/src/xml/node-set.ts`) dedup by `pointerId`. Nokogiri's `|` (`vendor/nokogiri/v1.18.3/ext/nokogiri/xml_node_set.c:252-268`) merges with libxml2's `xmlXPathNodeSetMerge`, which compares node pointers and, for namespace nodes, their prefix, href and owning element.

The port deviates in two places:

- `NodeSet#plus` compares `x.pointerId ?? x._node`. The `?? _node` arm exists only because `XML::Namespace` (`packages/nokogiri/src/xml/namespace.ts`) has no `pointer_id`.
- `HTML5::Node#pointerId` (`packages/nokogiri/src/html5/node.ts`) answers the parse5 node object. Nokogiri's `pointer_id` (`ext/nokogiri/xml_node.c:804-817`) answers an Integer.

## Acceptance criteria

- Namespace nodes in a union are deduped as `xmlXPathNodeSetMerge` does (same prefix and href on the same owning element), with no `?? _node` fallback in `plus`.
- `HTML5::Node#pointerId` answers a stable Integer per backing node, or the deviation is receipted at the declaration.
- Tests cover a union of two `namespace::*` results and of two HTML5 node sets.
