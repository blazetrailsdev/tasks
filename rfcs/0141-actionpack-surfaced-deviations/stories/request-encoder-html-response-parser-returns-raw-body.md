---
title: "request-encoder-html-response-parser-returns-raw-body"
status: draft
updated: 2026-09-28
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

`RequestEncoder` registers its `:html` encoder with
`response_parser: -> body { Rails::Dom::Testing.html_document.parse(body) }`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/request_encoder.rb:57`).
trails registers `responseParser: (body) => body`
(`packages/actionpack/src/action-dispatch/testing/request-encoder.ts:88-90`), so
`TestResponse#parsedBody` for `text/html` answers the raw string, and
`htmlDocument` in `packages/actionpack/src/action-dispatch/testing/assertions.ts:6-14`
throws for any non-XML mime type ("HTML parsing (rails-dom-testing) is not yet
implemented").

Consequences in `packages/actionpack/src/action-dispatch/dispatch/test-response.test.ts`:
`"response parsing"`'s HTML arm asserts `toBe("<html></html>")` where Rails
(`vendor/rails/v8.0.2/actionpack/test/dispatch/test_response_test.rb:31-40`)
asserts a `Nokogiri::XML::Document` and `at_xpath("/html/body/div").text`, and
`"HTML response pattern matching"` (`:55-72`) stays `it.skip` because it pattern
matches `html.at("main")`'s `name` / `content` / `children`.

`packages/nokogiri` ports `XML::Document` only; the JSON arm is also a plain
object where Rails parses into `ActiveSupport::HashWithIndifferentAccess`
(`request_encoder.rb:58`).

## Acceptance criteria

- An HTML document parse (the `Nokogiri::HTML5` surface `rails-dom-testing`'s
  `html_document` returns) exists, via an npm HTML parser wrapped in
  `packages/nokogiri`, and both `request-encoder.ts`'s `:html` parser and
  `assertions.ts`'s `htmlDocument` use it.
- The `:json` parser parses into `HashWithIndifferentAccess`.
- `"response parsing"`'s HTML arm asserts what Rails asserts, and
  `"HTML response pattern matching"` is ported.
