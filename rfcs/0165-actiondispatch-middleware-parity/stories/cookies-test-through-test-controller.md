---
title: "cookies-test-through-test-controller"
status: draft
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
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

`vendor/rails/v8.0.2/actionpack/test/dispatch/cookies_test.rb:99-1675` is an
`ActionController::TestCase` over a `TestController` (`:100-380`) that drives
every case through `get :action` and reads `@request.cookie_jar` /
`@response.cookies`. trails' `CookiesTest` in
`packages/actionpack/src/action-dispatch/dispatch/cookies.test.ts` builds bare
`CookieJar`s from a hand-made request host instead, so a test whose point is a
second request — `cookie jar mutated by request persists on future requests`
(`cookies_test.rb:985-991`) — cannot be ported and stays `it.skip`. The
`TestCase` (`action-controller/test-case.ts`) and `CookieAssertions`
(`test-helpers/abstract-unit.ts:509`) it needs are already ported.

## Acceptance criteria

- `CookiesTest` declares Rails' `TestController` and runs each test through
  `TestCase#get` with Rails' `setup` env, asserting through `CookieAssertions`
  and `@response.cookies`, not bare jars.
- `cookie jar mutated by request persists on future requests` is ported with
  its two requests.
