---
title: "Nokogiri XPath engine: support the namespace:: axis"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9088 replaced libxml2's `xmlXPathEvalExpression` (reached from
`ext/nokogiri/xml_xpath_context.c:364-420` `noko_xml_xpath_context_evaluate`) with a TS XPath 1.0 engine,
`packages/nokogiri/src/xml/xpath/evaluator.ts`. Its `axis()` raises `NotImplementedError` for the
`namespace::` axis, which libxml2 supports: Nokogiri answers `XML::Namespace` nodes for
`node.xpath("namespace::*")` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/namespace.rb`), and the XML
tree adapter in `xml/xpath-context.ts` exposes no namespace nodes to it (libxml2-wasm's
`XmlElement#namespaces` / `nsDeclarations` give the in-scope map).

## Acceptance criteria

- The engine's `namespace` axis yields one namespace node per in-scope prefix (plus `xml`), in
  document order after the element and before its attributes, for both the libxml2 and parse5 trees.
- `XPathContext#evaluate` answers them as `Nokogiri::XML::Namespace` (ported with `prefix` / `href`),
  and the `NotImplementedError` arm is deleted.
