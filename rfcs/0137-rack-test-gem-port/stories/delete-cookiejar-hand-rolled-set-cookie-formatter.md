---
title: "Delete CookieJar's hand-rolled set-cookie formatter now that write goes through Rack::Response"
status: draft
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CookieJar#write` (`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:429-439`)
formats nothing: it calls `response.set_cookie(name, value)` and
`response.delete_cookie(name, value)`, and the `Set-Cookie` string is built by
`Rack::Utils.set_cookie_header` (`vendor/rack/lib/rack/utils.rb`) from
`Rack::Response#set_cookie` (`vendor/rack/lib/rack/response.rb:270-280`).

trails carries a second, hand-rolled formatter in
`packages/actionpack/src/action-dispatch/middleware/cookies.ts`:
`formatSetCookie` / `formatDeleteCookie` (:427-445) and the public
`getSetCookieHeaders` (:237-247) that drives them — none of which Rails has.
`NullCookieJar` (`action-controller/metal/request-forgery-protection.ts:57-63`)
overrides `getSetCookieHeaders` alongside Rails' real `write`.

PR #7568 converged `Cookies#call` onto `Rack::Response`, so the response path no
longer goes through this formatter — it now only serves
`action-dispatch/dispatch/cookies.test.ts`'s assertions and the
`NullCookieJar` override. Its output also diverges from Rack's on the wire
(`; HttpOnly` / `; SameSite=Lax` vs Rack's `; httponly` / `; samesite=lax`,
and it re-applies the jar's `_options` defaults that `handle_options` now
applies at write time).

## Converged shape

Delete `getSetCookieHeaders`, `formatSetCookie` and `formatDeleteCookie`.
Tests that read a jar's pending headers go through a `Rack::Response` and
`jar.write(response)`, as `Cookies#call` does. `NullCookieJar` keeps only its
`write(*)` override, which is the one Rails has
(`cookies.rb`'s `class NullCookieJar`).

## Acceptance criteria

- [ ] `getSetCookieHeaders`, `formatSetCookie` and `formatDeleteCookie` are
      gone from `middleware/cookies.ts`, and `NullCookieJar` overrides only
      `write`.
- [ ] `dispatch/cookies.test.ts`'s ~20 call sites read the headers off a
      `Rack::Response` written by `jar.write`; no test renamed or reworded.
- [ ] `pnpm parity:api:extra --package actionpack` no longer reports the three
      names; `parity:api` / `parity:test` deltas non-negative; both call gates
      green with no new baseline rows.
