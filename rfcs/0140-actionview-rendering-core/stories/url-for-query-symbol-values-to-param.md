---
title: "url-for-query-symbol-values-to-param"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
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

Rails' `UrlHelperTest#test_url_for_does_not_escape_urls`
(`vendor/rails/v8.0.2/actionview/test/template/url_helper_test.rb:65-67`) asserts
`url_for(hash_for(a: :b, c: :d)) == "/?a=b&c=d"`: `Hash#to_query` sends
`to_param` to each value (`activesupport/lib/active_support/core_ext/object/to_query.rb`),
and `Symbol#to_param` is `to_s`, so `:b` renders as `b`.

In trails a Ruby Symbol is the colon-spelled string `":b"` (CLAUDE.md § "Ruby
idioms"), and `toParam` (`packages/activesupport/src/hash-utils.ts`) returns
it unchanged, so the query renders `a=%3Ab&c=%3Ad`. The test's route-backed
host now exists (`packages/actionview/src/template/url-helper.test.ts`,
`UrlHelperView` including `routes.urlHelpers()`), and the test was left
unported for this reason.

## Acceptance criteria

- Port `url for does not escape urls` into
  `packages/actionview/src/template/url-helper.test.ts` on `UrlHelperView`,
  with `a: ":b", c: ":d"`, and make it pass.
- The fix follows Ruby's `Symbol#to_param`, decided against the existing
  colon-Symbol convention (which values `toParam` may treat as Symbols), not a
  test-local workaround.
