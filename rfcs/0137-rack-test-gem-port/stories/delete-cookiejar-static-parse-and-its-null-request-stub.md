---
title: "CookieJar.parse and its nullRequest stub have no Rails counterpart"
status: done
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#7599
claim: "2026-09-07T22:55:35Z"
assignee: "default-cookie-serializer-is-marshal-not-json"
blocked-by: null
closed-reason: null
---

## Context

`CookieJar` has two constructors in Rails: `new(request)` (`cookies.rb:324`)
and `self.build(req, cookies)` (`:315-319`). There is no cookie-header parser
on it — the header is parsed upstream by Rack and reaches the jar as
`request.cookies`.

trails carries an extra `static parse(cookieHeader, request)` in
`packages/actionpack/src/action-dispatch/middleware/cookies.ts`, which splits a
`Cookie:` header on `;` and seeds `_cookies` directly. It is `@internal` and has
no non-test caller: `git grep 'CookieJar.parse('` finds it only in
`dispatch/cookies.test.ts` (≈60 sites) and `middleware/cookies.test.ts`.

PR #7598 made it worse in one narrow way: now that `CookieJar#initialize`
takes the request (`cookies.rb:324`), `parse` needs one too, and it defaults to
a module-private `nullRequest` stub so the ~60 header-only test call sites keep
compiling. That default has no Rails counterpart either — it exists solely to
serve `parse`.

## Converged shape

Delete `CookieJar.parse` and `nullRequest`. Each test site builds the jar the
way Rails' own tests do — `CookieJar.build(request, cookies)` with the cookie
hash the header would have produced — which is also what
`packages/actionpack/src/action-dispatch/dispatch/cookies.test.ts`'s newer
tests already do.

Rails' own `cookies_test.rb` never parses a header into a jar; it sets
`@request.headers["Cookie"]` and lets the request produce `cookies`
(`actionpack/test/dispatch/cookies_test.rb:742-743` is representative).

## Acceptance criteria

- [ ] `CookieJar.parse` and the `nullRequest` stub are gone from
      `middleware/cookies.ts`.
- [ ] Every call site builds through `CookieJar.build(request, cookies)`; no
      test name changes.
- [ ] `pnpm parity:api:extra --package actionpack` shows one fewer extra name
      on `middleware/cookies.ts`; both call gates green.
