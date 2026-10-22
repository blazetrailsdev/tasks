---
title: "test-response-html-parsed-body-at-xpath"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
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
`RequestEncoder`'s `html` parser parses through `Testing.htmlDocument()` (an `HTML5.Document`,
trails#9076), but in `@blazetrails/nokogiri` `HTML5::Document`
(`packages/nokogiri/src/html5/document.ts:12`) does not descend from `XML::Document`
(`packages/nokogiri/src/xml/document.ts`) as Nokogiri's
`HTML5::Document < HTML4::Document < XML::Document` does. The XPath evaluator this waited on
(`nokogiri-xpath-evaluator-behind-searchable-css`) is done; check that `Searchable#atXpath`
answers on an `HTML5.Document` once the ancestry is fixed.

The port (`packages/actionpack/src/action-dispatch/dispatch/test-response.test.ts:28-39`,
"response parsing") stops after the JSON half, so the test is `rails 5 vs trails 3`.

(Absorbs the remainder of `request-encoder-html-response-parser-returns-raw-body`, closed as
done by trails#9076. Its other leftover, `"HTML response pattern matching"` at `:68`, uses Ruby
pattern matching and is permanently unportable per CLAUDE.md § "Ruby pattern matching has no
port".)

## Acceptance criteria

- An `HTML5.Document` is a kind of `XML.Document`, and `Searchable#xpath` / `#atXpath` evaluate
  an XPath on it.
- "response parsing" carries both HTML assertions, and
  `pnpm parity:test --assertions --package actiondispatch` shows no `test_response_test.rb` count row.
- `"HTML response pattern matching"` stays `it.skip` under a `PERMANENT-SKIP:` line citing
  CLAUDE.md § "Ruby pattern matching has no port".
