---
title: "nokogiri-html5-create-element-namespace-definitions"
status: draft
updated: 2026-11-09
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

`Nokogiri::XML::Document#create_element` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document.rb:276-296`) sends an `xmlns` / `xmlns:foo` hash key (`NCNAME_RE`, `:20`) to `add_namespace_definition`. It then sets the element's default namespace from `namespace_definitions`. trails' HTML5 port (`packages/nokogiri/lib/html5/document.ts` `createElement`) is backed by parse5, which has no namespace definitions. So it sets every key as an attribute, receipted `@missingRailsCall add_namespace_definition` / `namespace_definitions` `CONVERGEABLE nokogiri-html5-create-element-namespace-definitions` (trails#9893).

## Acceptance criteria

- `HTML5::Node` ports `add_namespace_definition` and `namespace_definitions` over parse5 (an `xmlns`-attribute-backed model, as libxml2 records them for HTML documents).
- `createElement` has the `NCNAME_RE` arm and the `namespace=` tail as written, and both receipts are deleted.
- Tests mirror `test/xml/test_document.rb`'s `create_element` namespace cases where they apply to HTML5.
