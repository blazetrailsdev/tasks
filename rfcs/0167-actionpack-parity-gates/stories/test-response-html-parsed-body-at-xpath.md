---
title: "test-response-html-parsed-body-at-xpath"
status: draft
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
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

"response parsing" (`vendor/rails/v8.0.2/actionpack/test/dispatch/test_response_test.rb:23-41`) ends with
`assert_kind_of(Nokogiri::XML::Document, response.parsed_body)` and
`assert_equal("Content", response.parsed_body.at_xpath("/html/body/div").text)`.
`RequestEncoder`'s `html` parser now parses through `Testing.htmlDocument()` (an `HTML5.Document`),
but in `@blazetrails/nokogiri` `HTML5::Document` (`packages/nokogiri/src/html5/document.ts:11`) does not
descend from `XML::Document` (`packages/nokogiri/src/xml/document.ts:10`) as Nokogiri's
`HTML5::Document < HTML4::Document < XML::Document` does, and `Searchable` has no `xpath` / `at_xpath`
(`vendor/nokogiri/*/lib/nokogiri/xml/searchable.rb:179-195`): the only XPath evaluation over a parse5 tree
is the CSS-compiled one in `xpathImpl` (`packages/nokogiri/src/xml/searchable.ts`).
The port (`packages/actionpack/src/action-dispatch/dispatch/test-response.test.ts`, "response parsing")
stops after the JSON half, so the test is `rails 5 vs trails 3`.

## Acceptance criteria

- An `HTML5.Document` is a kind of `XML.Document`, and `Searchable#xpath` / `#atXpath` evaluate an XPath on it.
- "response parsing" carries both HTML assertions, and `pnpm parity:test --assertions --package actiondispatch` shows no `test_response_test.rb` count row.
