---
title: "nokogiri-relink-namespace-qname-and-nsdef-arms"
status: blocked
updated: 2026-11-28
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps:
  - nokogiri-libxml2-wasm-export-missing-c-functions
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "libxml2-wasm 0.7.1 (pinned) and 0.7.2 (latest) export no _xmlSplitQName2/_xmlNodeSetName nor nsDef struct writes; waits on nokogiri-libxml2-wasm-export-missing-c-functions"
closed-reason: null
---

## Context

C `relink_namespace` (`vendor/nokogiri/v1.19.7/ext/nokogiri/xml_node.c:69-160`) runs after every reparent. `packages/nokogiri/lib/xml/node.ts` `relinkNamespace` ports the unprefixed default-namespace search and the `@namespace_inheritance` arm only. Missing: the `xmlSplitQName2` + `xmlNodeSetName` arm for a prefixed name (`prefix:name`), the attribute arm, the redundant-`nsDef` removal against the parent (`prev->next = curr->next`, needs struct writes libxml2-wasm 0.7.1 does not expose), and the trailing re-search of `reparented->ns` and attribute relinking. `test_builder.rb` `test_builder_namespace` / `test_builder_namespace_part_deux` (`namespaces_defined_on`) depend on the nsDef arm.

## Acceptance criteria

- [ ] `relinkNamespace` mirrors every arm of `relink_namespace`, and its `@missingRailsCall xmlSplitQName2` receipt is deleted.
- [ ] `test_builder_namespace` and `test_builder_namespace_part_deux` are ported into `packages/nokogiri/test/xml/test-builder.test.ts`.
