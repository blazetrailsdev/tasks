---
title: "nokogiri-xpath-evaluator-behind-searchable-css"
status: done
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9088
claim: "2026-10-19T18:34:49Z"
assignee: "nokogiri-xpath-evaluator-behind-searchable-css"
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::CSS::Parser`, `CSS::XPathVisitor` and `CSS.xpath_for` are ported (`packages/nokogiri/src/css/`, `packages/nokogiri/src/css.ts`, by port-nokogiri-css-xpath-visitor) and emit the XPath Nokogiri emits. `packages/nokogiri/src/xml/searchable.ts` still evaluates CSS with its private selector matcher (`Compound` / `Parser` / `matches` / `evaluate` / `xpathImpl`), receipted `@noRailsEquivalent CONVERGEABLE port-nokogiri-css-xpath-visitor`, because the HTML5 parse5 tree has no XPath engine.

Rails path: `Nokogiri::XML::Searchable#css_internal` → `css_rules_to_xpath` → `xpath_query_from_css_rule` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/searchable.rb:229-270`) builds an `XPathVisitor` (`builtins: OPTIMAL`, `doctype:` from the document) and calls `CSS.xpath_for(rule, prefix:, ns:, visitor:)`, then `xpath_internal` / `xpath_impl` runs it with libxml2's XPathContext (`xml/xpath_context.rb`), including the `nokogiri-builtin:css-class` / `local-name-is` functions (`ext/nokogiri/xml_xpath_context.c`) and handler functions.

## Acceptance criteria

- [ ] An XPath 1.0 evaluator over the HTML5 tree (or a libxml2 document mirroring it) runs `CSS.xpath_for`'s output, including `nokogiri-builtin:css-class`, `nokogiri-builtin:local-name-is` and `nokogiri:` handler functions.
- [ ] `xpathQueryFromCssRule` builds the `XPathVisitor` and calls `xpathFor` as `searchable.rb:250-262` does.
- [ ] The private selector matcher in `searchable.ts` and its `CONVERGEABLE` receipts are deleted.
