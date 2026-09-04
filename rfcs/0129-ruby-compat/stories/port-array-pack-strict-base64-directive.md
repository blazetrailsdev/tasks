---
title: "Port Array#pack's m/m0 directives so basic_authorize makes the strict-base64 call Rails makes"
status: ready
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Array#pack('m0')` — strict Base64, no line breaks — has no port anywhere in
trails. `packUuidNamespace`
(`packages/activesupport/src/core-ext/digest/uuid.ts:127`) is an unrelated
name collision, not a `pack`.

Surfaced by RFC 0137-rack-test-gem-port:
`Rack::Test::Session#basic_authorize` is

```ruby
encoded_login = ["#{username}:#{password}"].pack('m0')
```

(`vendor/rack-test/lib/rack/test.rb:199`), so `port-rack-test-session` has no
receiver for the call Rails makes and would otherwise reach for a bespoke
base64 helper — the shape this RFC exists to stop.

`m0` is one directive of one method; the story is the directive, not `pack`.
Whoever claims it should decide whether the seat is a general
`Array#pack` with a directive parser or an `m`-family-only port, and say which
in the PR body. `m` (with line breaks) and `m0` differ only in wrapping, so
covering both is cheap; the rest of `pack`'s directive table is not in scope.

## Acceptance criteria

- [ ] `pack` on the Ruby `Array` seat, handling at least the `m` / `m0`
      directives, anchored to `vendor/ruby/`'s `pack.c` documentation for the
      directive semantics.
- [ ] A test pins `m0`'s no-newline output against MRI (run `ruby`, it is on
      PATH) for an input long enough that `m` would wrap and `m0` would not.
- [ ] No new third-party dependency; no bespoke base64 helper left behind at a
      call site.
