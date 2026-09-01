---
title: "Port Rack::Response::Raw so Persisted#context stops standing it in"
status: in-progress
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7326
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Response::Raw` (`vendor/rack/lib/rack/response.rb`, the
`Raw` class Rack exposes for header-only responses) is unported. It is what
`Rack::Session::Abstract::Persisted#context` constructs so that
`#commit_session` has somewhere to write the session cookie:

```ruby
def context(env, app = @app)
  req = make_request env
  prepare_session(req)
  status, headers, body = app.call(req.env)
  res = Rack::Response::Raw.new status, headers   # abstract/id.rb:275
  commit_session(req, res)
  [status, headers, body]
end
```

and `#set_cookie` calls `response.set_cookie(@key, cookie)`
(`vendor/rack-session/lib/rack/session/abstract/id.rb:423-427`).

PR #7317 ported `#context` / `#commit_session` without it, so
`packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`
carries two receipts that exist only to stand in for the missing class:

- `interface ResponseRaw` — `@noRailsEquivalent PERMANENT`, a structural
  stand-in with a single `setCookie` member;
- `function setCookieOn(headers, key, value)` — `@noRailsEquivalent PERMANENT`,
  which reimplements `Raw#set_cookie` by delegating to trails' ported
  `Rack::Utils.set_cookie_header!` (`packages/rack/src/utils.ts:316`) and
  translating three option keys whose trails spelling is camelCase
  (`httpOnly`/`sameSite`/`maxAge`) to the snake_case names that function reads.

Both are debt, not settled decisions: with `Rack::Response::Raw` in
`packages/rack`, `#context` constructs the real class and both receipts delete.

Note the key-spelling translation is a second, separable finding it exposes:
trails' `set_cookie_header` reads Ruby's symbol names literally while
`Persisted::DEFAULT_OPTIONS` camelCases them per the repo's Ruby→TS rules, so
the two ports of the same gem disagree on one hash's key spelling.

## Converged shape

- `Rack::Response::Raw` ported into `packages/rack/src/response.ts` at its Rails
  name, with `set_cookie` / `delete_cookie` / the header accessors it inherits.
- `Persisted#context` builds it (`new Response.Raw(status, headers)`), matching
  `abstract/id.rb:275`.
- `ResponseRaw` and `setCookieOn` deleted from `abstract-store.ts`, and their
  two `@noRailsEquivalent PERMANENT` receipts with them.
- The camel/snake key mismatch resolved in one direction rather than translated
  at the call site.

## Acceptance criteria

- `packages/actionpack/.../abstract-store.ts` contains no `ResponseRaw` and no
  `setCookieOn`, and `pnpm parity:api:extra --package actionpack` shows two
  fewer `@noRailsEquivalent` tags.
- `Persisted#context` passes a real `Rack::Response::Raw` to `commit_session`.
- A test asserts the session cookie reaches the response headers through it.
