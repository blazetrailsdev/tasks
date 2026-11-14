---
title: "Plain-assign nokogiri's remaining table-named seats (CSS, SAX, Racc)"
status: draft
updated: 2026-11-14
rfc: "0205-namespace-seats-are-plain-javascript"
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

trails#10109 made nokogiri's `XML.Node`, `NodeSet`, `Attr`, `Namespace`, `XPathContext` and `HTML5.Node` seats plain assignments, because `packages/nokogiri/lib/constants.generated.ts` already names those classes. The other classes that table names still seat with `constSet`, which has no Rails `const_set` behind it. In nokogiri these are plain `class Nokogiri::CSS::Node` definitions (e.g. `vendor/nokogiri/*/lib/nokogiri/css/node.rb`):

- `css/node.ts:60` `CSS.Node`, `css/syntax-error.ts:7`, `css/xpath-visitor.ts:389`, `css/selector-cache.ts:33`
- `xml/syntax-error.ts:33`, `xml/parse-options.ts:154`, `xml/document-fragment.ts:56`, `xml/sax/document.ts:15`
- `racc/parser.ts:257-258` (`Racc::ParseError`, `Racc::Parser`)

`CSS`, `SAX` and `Racc` in `namespaces.ts` are typed `{ name: string; [name: string]: unknown }`, so a plain assignment there does not type-check against a declared property.

## Acceptance criteria

- [ ] `CSS`, `SAX` and `Racc` declare each seated member's type, with no index signature.
- [ ] Each seat above is a plain `Owner.Name = Klass`, or is deleted where nothing reads it.
- [ ] `rbModName` answers the same path for each class on the built dist, and every `dist/**.js` module loads as a plain-node entry.
- [ ] `pnpm parity:class-paths:check` passes.
