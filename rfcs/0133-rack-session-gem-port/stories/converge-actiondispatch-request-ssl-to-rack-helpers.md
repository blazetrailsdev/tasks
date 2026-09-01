---
title: "Drop ActionDispatch::Request's re-declared ssl? and inherit Rack::Request::Helpers' two-arm body"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7329
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Request` does not define `ssl?`. It gets it from
`include Rack::Request::Helpers`
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:21`), whose body is

```ruby
def ssl?
  scheme == 'https' || scheme == 'wss'
end
```

(`vendor/rack/lib/rack/request.rb:410-412`).

trails re-declares it instead, at
`packages/actionpack/src/action-dispatch/http/request.ts:244`:

```ts
get ssl(): boolean {
  return this.scheme === "https";
}
```

Two divergences follow from the re-declaration:

- the `wss` arm is dropped, so a WebSocket-over-TLS request answers `false`
  where Rails answers `true`. `packages/rack/src/request.ts:232` already carries
  the correct two-arm body;
- the method exists at a Rails path that does not declare it, which is invented
  surface at that file even though the name itself is Rails'.

`port-rack-request-ssl-predicate` (PR #7326) converged the two CALL SITES that
were guarding a missing method — `Persisted#security_matches?`
(`rack-session id.rb:371-374`) and `CookieJar#write_cookie?`
(`actionpack cookies.rb:448-450`) — but left this re-declaration in place; both
of them reach `ActionDispatch::Request`, so both read the one-arm body today.
`ActionDispatch::Request#ssl` also feeds `#protocol`
(`http/request.ts:263`) and every `url`/`base_url` built from it.

## Converged shape

`ActionDispatch::Request` inherits the Rack body rather than restating it —
`Rack::Request::Helpers` reaches `ActionDispatch::Request` through the repo's
mixin idiom (`include()` / `Included<>` from `@blazetrails/activesupport`, or a
`this`-typed function assigned to the class, per CLAUDE.md "Module mixins"), so
`ssl` lives once, at `packages/rack/src/request.ts:232`, with both arms.

If the whole `Rack::Request::Helpers` mixin is too large a step for one story,
the narrow version is to delete the actionpack re-declaration and let the class
answer from the rack `Request` it already relies on for `scheme` — but the
duplicated one-arm body must not survive either way.

## Acceptance criteria

- `packages/actionpack/src/action-dispatch/http/request.ts` no longer declares
  its own `ssl`.
- An `ActionDispatch::Request` whose scheme is `wss` answers `ssl === true`,
  with a test pinning it — the arm that is wrong today.
- `#protocol` and the `url` / `baseUrl` readers built on it are unchanged for
  `https` and `http`.
- `pnpm parity:api --package actionpack` shows no regression.
