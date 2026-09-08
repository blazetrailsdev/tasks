---
title: "The nil cookies_serializer arm returns JSON where Rails returns marshal"
status: done
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 7599
claim: "2026-09-07T22:55:35Z"
assignee: "default-cookie-serializer-is-marshal-not-json"
blocked-by: null
closed-reason: null
---

## Context

`SerializedCookieJars#serializer` picks the cookie serializer from
`request.cookies_serializer`:

```ruby
@serializer ||=
  case request.cookies_serializer
  when nil
    ActiveSupport::Messages::SerializerWithFallback[:marshal]
  when :hybrid
    ActiveSupport::Messages::SerializerWithFallback[:json_allow_marshal]
  when Symbol
    ActiveSupport::Messages::SerializerWithFallback[request.cookies_serializer]
  else
    request.cookies_serializer
  end
# actionpack/lib/action_dispatch/middleware/cookies.rb:576-585
```

PR #7598 converged the `:hybrid`, `Symbol` and `else` arms onto
`SerializerWithFallback` (`packages/activesupport/src/messages/serializer-with-fallback.ts`),
which is what let `reserialize?` (`cookies.rb:588-592`) keep its
`is_a?(SerializerWithFallback) && != [:marshal]` guard. The **`when nil` arm
still returns trails' own `JSON_SERIALIZER`** — a module-private object in
`packages/actionpack/src/action-dispatch/middleware/cookies.ts` — where Rails
returns `SerializerWithFallback[:marshal]`.

That is the one remaining divergence in the method, and it is deliberate but
unpaid: flipping the unconfigured default changes the wire format of every
cookie trails writes, so it wants its own PR and its own look at the fallout
(`CookieStore`, the `Cookies` middleware tests, and the trails-only
`SerializedCookieJars` test that names JSON as the default).

## Acceptance criteria

- [ ] The `nil` arm returns `SerializerWithFallback[:marshal]`, per
      `cookies.rb:577-578`.
- [ ] `JSON_SERIALIZER` and the `CookieSerializer` interface are re-examined:
      the interface stays only if the `else` arm still needs a structural type
      for a caller-supplied object.
- [ ] `reserialize?`'s `!= [:marshal]` conjunct then does the work it does in
      Rails — an unconfigured jar does not migrate on read.
- [ ] Cookie round-trips through `CookieStore` and the actionpack suite stay
      green, or their expectations are updated to the marshal wire format.
