---
title: "nokogiri: port XML::Node#children= with coerce"
status: ready
updated: 2026-11-07
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: ["nokogiri"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/nokogiri/lib/xml/node.ts` declares only the `children` reader. `parity:api` pairs it with Ruby's `children=` writer (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/node.rb:385-393`), which calls `coerce` (node.rb:1567) and is not ported. The reader carries `@missingRailsCall coerce — CONVERGEABLE nokogiri-xml-node-children-writer`.

## Acceptance criteria

- [ ] `XmlNode` has a `children` writer that coerces a Node, NodeSet, DocumentFragment or String the way `coerce` does, unlinks the current children and adds the new ones.
- [ ] Tests port the gem's `children=` cases.
- [ ] The receipt is deleted.
