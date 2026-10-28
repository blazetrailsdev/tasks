---
title: "Break nokogiri's Searchable/NodeSet load cycle so its XML reads become direct imports"
status: done
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9416
claim: "2026-10-28T17:49:26Z"
assignee: "routing-url-for-and-collector-plain-modules"
blocked-by: null
closed-reason: null
---

## Context

On trails#9378, converting nokogiri's deferred namespace reads to ES imports
broke loading. A value import of `./node-set.js` (or `./node.js`, `./attr.js`,
`../html5/node.js`) from `xml/searchable.ts` or `xml/xpath-context.ts` adds an
edge that evaluates `node-set.js` before `searchable.js`. Plain-node entry of
`packages/nokogiri/dist/index.js` then throws
`Cannot access 'Searchable' before initialization` at
`include(NodeSet, Searchable)` (`xml/node-set.ts`).

So these reads still go through the namespace:

- `searchable.ts`: `new XML.NodeSet(document)` (x2).
- `xpath-context.ts`: `XML.NodeSet`, `XML.Node`, `XML.Attr` and `HTML5.Node` in
  `wrap` / `xpath2ruby`.

Nokogiri's Ruby (`lib/nokogiri/xml/searchable.rb`, `node_set.rb`) names
`XML::NodeSet` directly. The converged shape is a direct ES import once the
`include(NodeSet, Searchable)` cycle no longer depends on evaluation order.

## Acceptance criteria

- [ ] Break the cycle, e.g. by moving `include(NodeSet, Searchable)` so that
      `searchable.ts` is evaluated first regardless of entry, or by having
      `searchable.ts` take no value edge into `node-set.ts`. Then convert each
      read above to a direct import.
- [ ] Every built `packages/nokogiri/dist/**.js` module loads as a plain-node
      entry.
