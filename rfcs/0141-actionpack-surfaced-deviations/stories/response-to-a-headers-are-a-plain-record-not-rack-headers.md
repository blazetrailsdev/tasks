---
title: "Response#to_a hands back a plain record where Rails hands back the case-insensitive Rack::Headers"
status: draft
updated: 2026-10-05
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `ActionDispatch::Response#to_a`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:410-413`)
is `rack_response @status, @headers.to_hash`. `@headers` is a `Rack::Headers`,
a `Hash` subclass, and `Hash#to_hash` returns the receiver, so the triplet's
second element is still the case-insensitive `Rack::Headers`. Rails' own tests
read it with HTTP casing:
`vendor/rails/v8.0.2/actionpack/test/controller/new_base/bare_metal_test.rb:39`
(`assert headers["Content-Type"]`) and `:162-203` (`assert_nil
headers["Content-Type"]`).

trails' `Response#toRack`
(`packages/actionpack/src/action-dispatch/http/response.ts:426-429`) passes
`this._headers.toHash()`, a plain lowercase-keyed record, so
`headers["Content-Type"]` is always `undefined`. The port of
`bare_metal_test.rb`
(`packages/actionpack/src/action-controller/controller/new-base/bare-metal.test.ts`,
trails#8513) therefore reads `headers["content-type"]` and
`headers["content-length"]` in `BareTest` and `HeadTest`; with Rails' casing
the `assert_nil` tests would pass vacuously. `RackResponse`
(`packages/rack/src/index.ts:8`) types the element as a plain `Record`.

## Acceptance criteria

- The headers element of the triplet `Response#to_a` returns answers a
  case-insensitive read, as `Rack::Headers` does in Rails
  (`response.rb:410-413`).
- `new-base/bare-metal.test.ts` reads headers with Rails' casing
  (`Content-Type`, `Content-Length`), and the `HeadTest` nil assertions fail if
  the header is present under any casing.
- No test-only wrapper is added to get there.
