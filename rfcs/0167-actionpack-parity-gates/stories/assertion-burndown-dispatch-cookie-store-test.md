---
title: "assertion-burndown-dispatch-cookie-store-test"
status: done
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: trails#9045
claim: "2026-10-18T19:14:54Z"
assignee: "assertion-burndown-dispatch-cookie-store-test"
blocked-by: null
closed-reason: null
---

## Context

Split from `assertion-burndown-dispatch-http-tests-tail`.
`vendor/rails/v8.0.2/actionpack/test/dispatch/session/cookie_store_test.rb:1-471`
→ `packages/actionpack/src/action-dispatch/dispatch/session/cookie-store.test.ts`
(327 lines) reported 19 count, 27 kind and 5 value mismatches (2026-10-17).

Every trails `CookieStoreTest` body is a unit test on a fake jar. Rails' bodies
are `IntegrationTest` requests through `CookieStore`, using `with_test_route_set`,
the overridden `get` (`:433-447`) and the same-file `assert_session_cookie`
(`:77-95`). `actioncontroller/controller/flash.test.ts`'s `withTestRouteSet` is
the trails shape for the app. Porting `assert_session_cookie` as a same-file
helper lets `assertion-kinds-fold-actionpack-private-assert-helpers` fold it on
both sides.

## Acceptance criteria

- Each `CookieStoreTest` body is the Rails body, run through `CookieStore` on an
  integration app rather than a fake jar.
- `pnpm parity:test --assertions` shows no divergence rows for the file apart
  from unmapped-helper rows left to the fold story, and the actiondispatch mark is tightened.
