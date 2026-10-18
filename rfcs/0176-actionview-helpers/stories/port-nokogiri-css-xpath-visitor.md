---
title: "Port Nokogiri CSS parser and XPath visitor behind Searchable css"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/nokogiri/src/xml/searchable.ts` ports `Nokogiri::XML::Searchable#css` / `#at_css` / `extract_params` / `css_internal` / `css_rules_to_xpath` / `xpath_query_from_css_rule` / `xpath_internal` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/searchable.rb:129-270`). Nokogiri builds an XPath string through `Nokogiri::CSS::Parser` (`lib/nokogiri/css/parser.y`) and `Nokogiri::CSS::XPathVisitor` (`lib/nokogiri/css/xpath_visitor.rb`), then evaluates it with libxml2's XPath. trails' HTML5 document is a parse5 tree with no XPath engine, so the file carries a private selector parser and evaluator (`Compound` / `Parser` / `matches` / `evaluate`), receipted `@noRailsEquivalent CONVERGEABLE port-nokogiri-css-xpath-visitor`. It covers a subset: type, `*`, id, class, attribute operators, the descendant, `>`, `+` and `~` combinators, groups, `:root`, `:first-child`, `:last-child`, `:only-child`, `:nth-child(an+b)`, `:empty`, `:not(...)` and handler pseudo-classes.

## Acceptance criteria

- [ ] `CSS::Parser` and `CSS::XPathVisitor` ported at their Nokogiri paths, emitting the XPath Nokogiri emits.
- [ ] An XPath evaluator over the HTML5 tree (or a libxml2 document mirroring it) runs that XPath, and the private evaluator is deleted along with its receipt.
