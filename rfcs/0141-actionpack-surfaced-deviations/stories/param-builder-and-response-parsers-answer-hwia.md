---
title: "ParamBuilder#make_params and RequestEncoder response parsers answer HWIA / an html document"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::ParamBuilder#make_params` is
`ActiveSupport::HashWithIndifferentAccess.new`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/param_builder.rb:162-164`),
so `from_query_string` / `from_pairs` answer an HWIA at every level. trails'
`makeParams` (`packages/actionpack/src/action-dispatch/http/param-builder.ts:249`)
answers `Object.create(null)`.

Likewise `RequestEncoder`'s registered response parsers
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/request_encoder.rb:57-58`)
parse JSON with `object_class: ActiveSupport::HashWithIndifferentAccess` and
HTML through `Rails::Dom::Testing.html_document.parse`; trails'
(`packages/actionpack/src/action-dispatch/testing/request-encoder.ts:96-102`)
answer a plain `JSON.parse` object and the raw HTML string.

Surfaced converging `param_builder_test.rb` and `test_response_test.rb`
assertions: `assert_instance_of ActiveSupport::HashWithIndifferentAccess`
(`param_builder_test.rb:15,21`) and `assert_kind_of` HWIA / Nokogiri document
(`test_response_test.rb:28,38`) fail against the port.

## Acceptance criteria

- `makeParams` answers a `HashWithIndifferentAccess`, and every caller of
  `fromQueryString` / `fromPairs` / `fromHash` still passes.
- The json response parser answers an HWIA; the html parser answers the
  rails-dom-testing html document.
- `param-builder.test.ts` "simple query string" / "nested parameters" and
  `test-response.test.ts` "response parsing" port their `assert_instance_of` /
  `assert_kind_of` lines and show 0 assertion-mismatch rows.
