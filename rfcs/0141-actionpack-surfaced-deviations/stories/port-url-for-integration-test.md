---
title: "Port url_for_integration_test.rb's 87-case each_with_index table"
status: draft
updated: 2026-09-26
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

Since trails#8153 the Ruby test extractor expands the `each_with_index` table in
`vendor/rails/v8.0.2/actionpack/test/controller/url_for_integration_test.rb:75-93`
into its 87 tests (`test_<url.gsub(/\W/, '_')>_<i>`). The first `if` arm
dispatches a request and calls `controller.url_for(hash)`; the `else` arm calls
`url_for(@routes, params.first)`. The routes come from the `Mapping` draw block
at the top of the file. There is no
`packages/actionpack/src/action-controller/url-for-integration.test.ts`, so all
87 score as missing in `actioncontroller`.

## Acceptance criteria

- `url-for-integration.test.ts` ports the `Mapping` routes and the table as one
  `for (const [i, [url, params]] of …)` loop, split per element on
  `params.length > 1` like Rails. Titles must normalize to the Ruby names, e.g.
  `` ` ${url.replaceAll(/\W/g, "_")...} ${i}` ``; extend
  `scripts/test-compare/extract-ts-core.ts#evalBoundExpression` if the title
  needs it.
- `controller/url_for_integration_test.rb` reports 0 missing in `parity:test`.
