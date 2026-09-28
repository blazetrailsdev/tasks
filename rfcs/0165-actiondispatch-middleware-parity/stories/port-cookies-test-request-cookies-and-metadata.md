---
title: "Port cookies_test.rb's request-cookie, expiry and metadata tests"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-cookies-test-domain-options"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last 21 missing tests in
`vendor/rails/v8.0.2/actionpack/test/dispatch/cookies_test.rb` (Rails lines
1405-1675, from `test_cookies_hash_is_indifferent_access` at `:1405`): indifferent access on the jar and on request cookies; cookies
retained across requests, cleared, set through the `HTTP_COOKIE` header and
through `request.cookies`, and their precedence; cookie override; signed,
encrypted and plain cookies with relative `expires:`; `false` values with
metadata; switching metadata off by config; and reading Rails 5.2-era signed and
encrypted cookies with the metadata config on and off.

## Acceptance criteria

- The 21 tests are ported in Rails order.
- `pnpm parity:test --package actiondispatch` reports `cookies_test.rb` 143/143
  with 0 skipped.
