---
title: "html-sanitizer: port the Parser/Scrubber/Serializer concerns so HTML4 and HTML5 vendors parse with their own fragment"
status: blocked
updated: 2026-10-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-10-17T11:34:30Z"
assignee: "actionview-url-and-sanitize-helper-concerns-and-sanitizer-memos"
blocked-by: "Needs an owner decision: the HTML4 vendor must parse through a Nokogiri HTML4 fragment, but @blazetrails/nokogiri is parse5-backed and has no HTML4 parser (CLAUDE.md 'DOM testing is HTML5 only', trails#8947). rails-html-sanitizer/loofah are also not vendored."
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
