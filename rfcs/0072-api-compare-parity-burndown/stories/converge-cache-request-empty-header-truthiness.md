---
title: "converge-cache-request-empty-header-truthiness"
status: closed
updated: 2026-07-30
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: RFC 0072 is a data-layer parity:api burndown; actionpack work does not belong here. Re-file under an actionpack-scoped RFC if wanted."
---

## Context

Review of PR #5637 caught a Ruby-vs-JS truthiness divergence in
`handleConditionalGetBang` (an empty `ETag` header is truthy in Ruby but falsy
in JS) and it was fixed there. Auditing the rest of
`packages/actionpack/src/action-dispatch/http/cache.ts` turned up two more of
the same class on the `Cache::Request` side, both pre-existing and untouched by
that PR:

- `etagMatches` (cache.ts:55) opens with `if (!etag) return false`. Rails is
  `if etag` (`vendor/rails/actionpack/lib/action_dispatch/http/cache.rb:32-37`),
  and `""` is truthy in Ruby, so Rails proceeds to test
  `validators.include?("")`. Ours short-circuits to `false`. Note Rails returns
  `nil` (not `false`) when `etag` is nil — the implicit `if` value.
- `fresh` (cache.ts:61) branches on `if (ifNoneMatch.call(this))` and
  `if (et)`. Rails branches on `if if_none_match` (`cache.rb:47-49`) and
  `if etag` (`cache.rb:62`). An empty `If-None-Match` header therefore takes the
  ETag branch in Rails but falls through to the `If-Modified-Since` branch in
  ours, so `fresh?` can return a different answer for a request that sends an
  empty `If-None-Match`.

One more on the `Cache::Response` side, also pre-existing: `cacheControlSegments`
(cache.ts:251) returns `undefined` for an empty `Cache-Control` header, because
it tests `cc ?`. Rails' `if cache_control = _cache_control` (`cache.rb:156`) is
truthy for `""` and yields `"".delete(" ").split(",")` — an empty array. So
`cacheControlHeaders` sees "no segments" in ours vs "zero segments" in Rails.

`ifNoneMatchEtags` (cache.ts:46) has the same shape (`h ? … : []` vs Rails'
`if_none_match ? … : []`) but is benign — Ruby's `"".split(",")` is `[]`, which
is what the JS falsy branch already returns.

## Acceptance criteria

- `etagMatches` and `fresh` distinguish "header absent" from "header empty" the
  way Rails does — presence checks against `undefined`, not JS falsiness.
- Decide and document whether `etagMatches` should mirror Rails' `nil` return
  for an absent etag or keep `false` (it is typed `boolean` today and every
  call site uses it as one).
- Regression coverage for an empty `If-None-Match` header on `fresh` and an
  empty etag on `etagMatches`, failing on baseline. Mirror Rails' own cases in
  `vendor/rails/actionpack/test/dispatch/request_test.rb` /
  `response_test.rb` where they exist; do not invent test names.
- `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` stays clean.

Related: [[project_ruby_vs_js_truthiness_in_ports]].
