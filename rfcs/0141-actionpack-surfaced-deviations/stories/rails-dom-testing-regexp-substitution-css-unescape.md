---
title: "rails-dom-testing matcher_for regexp arm vs nokogiri 1.19 CSS string unescape"
status: draft
updated: 2026-11-26
rfc: "0141-actionpack-surfaced-deviations"
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

`SubstitutionContext#matcher_for` (`vendor/rails-dom-testing/v2.3.0/lib/rails/dom/testing/assertions/selector_assertions/substitution_context.rb:27-35`) renders a Regexp as `"\"#{value}\""`, the raw source inside quotes. Nokogiri v1.19.7's `XPathVisitor#xpath_function_argument` (`vendor/nokogiri/v1.19.7/lib/nokogiri/css/xpath_visitor.rb:329-337`) now runs custom pseudo-class string args through `Parser.unescape_css_string` (`css/parser.rb:30-38`), so `\d` decodes to U+000D and `:match('id', ?)` with `/\d+/` matches nothing. rails-dom-testing 2.3.0 is the latest release, so upstream has the same break.

trails' `packages/actionview/lib/rails-dom-testing/assertions/selector-assertions/substitution-context.ts` `matcherFor` renders the Regexp arm as `rbInspect(rbRegToS(value, "onig"))` (Ruby `value.to_s.inspect`), whose backslash escaping round-trips through the CSS unescape. Receipted `CONVERGEABLE` at the call site.

## Acceptance criteria

- When rails-dom-testing ships a release compatible with nokogiri 1.19's string unescaping, vendor it and converge `matcherFor`'s Regexp arm to that body, dropping the receipt.
- `selector-assertions.test.ts` "substitution values", "multiple substitution values", "nested css select" stay green.
