---
title: "nokogiri-xml-builder"
status: in-progress
updated: 2026-11-27
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10845
claim: "2026-11-27T16:44:51Z"
assignee: "nokogiri-xml-builder"
blocked-by: null
closed-reason: null
---

## Context

trails has no `Nokogiri::XML::Builder` (`vendor/nokogiri/v1.19.7/lib/nokogiri/xml/builder.rb`); `packages/nokogiri/lib/xml/` holds no `builder.ts`. Every test in `vendor/nokogiri/v1.19.7/test/namespaces/test_serializing_namespaces.rb` builds its tree with `Nokogiri::XML::Builder.new do |xml| xml["ds"].Signature(...) end.doc.to_xml(save_with: AS_XML)`, so nokogiri-port-test-serializing-namespaces cannot be ported until it exists. The builder also needs `XML::Node.new`, `add_child`, `add_namespace_definition` / `namespace=` on `packages/nokogiri/lib/xml/node.ts`, none of which are ported yet.

## Acceptance criteria

- [ ] `packages/nokogiri/lib/xml/builder.ts` ports `XML::Builder` (`initialize`, `doc`, `[]` namespace selection, `method_missing` tag dispatch, `text`, `to_xml`) with the Rails names, and its `NodeBuilder`.
- [ ] The `XML::Node` methods the builder calls are ported at their `xml/node.rb` names.
- [ ] `test/xml/test_builder.rb` tests the port reaches are ported verbatim.
