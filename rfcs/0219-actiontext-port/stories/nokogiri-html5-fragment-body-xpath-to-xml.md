---
title: "Nokogiri HTML5::DocumentFragment#xpath and NodeSet#to_xml; port test_fragment_body"
status: draft
updated: 2026-11-11
rfc: "0219-actiontext-port"
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

`TestNokogumbo#test_fragment_body` (`vendor/nokogiri/v1.18.3/test/html5/test_nokogumbo.rb:74-78`) calls `doc.xpath("main/span").to_xml` and `doc.xpath("comment()").text` on an `HTML5::DocumentFragment`. trails' fragment (`packages/nokogiri/lib/html5/document-fragment.ts`) has no xpath over parse5 children and `NodeSet#to_xml` (`lib/xml/node-set.ts`) is not ported. Split out of nokogiri-html5-document-to-xml-through-node.

## Acceptance criteria

- `HTML5::DocumentFragment#xpath` answers a relative path over its children, and `NodeSet#to_xml` is ported (`lib/nokogiri/xml/node_set.rb`).
- `test_fragment_body` is ported as `it("fragment_body")` with the `buffer` fixture from the Rails test file.
