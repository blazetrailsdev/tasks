---
title: "Nokogiri::HTML5.parse / .fragment singleton methods"
status: in-progress
updated: 2026-11-24
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10698
claim: "2026-11-24T15:52:37Z"
assignee: "nokogiri-html5-document-fragment-gumbo-fragment"
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::HTML5`'s singleton methods `parse` and `fragment` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5.rb:273-282`) delegate to `Document.parse` / `DocumentFragment.parse`. trails' `HTML5` namespace (`packages/nokogiri/lib/index.ts:38`) is `{ Document, DocumentFragment }` with neither function, so ported tests such as `test/html5/test-nokogumbo.test.ts` "fragment body" (`test_nokogumbo.rb:74-78`, which calls `Nokogiri::HTML5.fragment`) call `DocumentFragment.parse` directly.

## Acceptance criteria

- `HTML5.parse(...)` and `HTML5.fragment(...)` exist on the namespace and delegate as Rails does.
- `test-nokogumbo.test.ts` calls `HTML5.fragment`.
