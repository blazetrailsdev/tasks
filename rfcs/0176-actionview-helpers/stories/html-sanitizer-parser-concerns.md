---
title: "html-sanitizer: port the Parser/Scrubber/Serializer concerns so HTML4 and HTML5 vendors parse with their own fragment"
status: ready
updated: 2026-10-16
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

rails-html-sanitizer builds `Rails::HTML4::{Full,Link,SafeList}Sanitizer` and
`Rails::HTML5::*` from shared concerns:

- `HTML::Concern::ComposedSanitize`
- `Scrubber::{Full,Link,SafeList}`
- `Serializer::UTF8Encode`
- a parser concern, `Parser::HTML4` (Loofah HTML4) or `Parser::HTML5`
  (Loofah HTML5)

The concerns live in `lib/rails/html/sanitizer.rb`.

trails' sanitizers (`packages/html-sanitizer/src/full-sanitizer.ts`,
`link-sanitizer.ts` and `safe-list-sanitizer.ts`) call the sanitize-html
engine (`engine.ts`) directly, so there is no parser concern. trails#8933
seated `HTML5.*` in `html5.ts` as subclasses of the HTML4 classes, so both
vendors parse the same way.

## Acceptance criteria

- The parser / scrubber / serializer concerns are ported at their Rails names.
- The HTML4 vendor parses through a Nokogiri HTML4 fragment, and the HTML5
  vendor through `HTML5.DocumentFragment` (`packages/nokogiri/src/html5/`).
- The `html5.ts` subclasses are replaced by classes composed from the concerns,
  as in Rails.
