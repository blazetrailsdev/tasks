---
title: "Port Rack::Test::Cookie and Rack::Test::CookieJar"
status: ready
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps:
  [
    "enroll-rack-test-in-compare-tooling",
    "port-uri-for-parse-merge-and-scheme-classes",
    "port-time-parse-reader-onto-the-date-time-seat",
  ]
deps-rfc: ["0129-ruby-compat"]
est-loc: 400
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 7 of the RFC. `Rack::Test::CookieJar` is the store
`Rack::Test::Session` round-trips cookies through, and it is what trails is
standing in for today: `packages/actionpack/src/action-dispatch/testing/
integration.ts:1073` gives its private `MockSession` a
`CookieJar.build(undefined, {})` — an `ActionDispatch::Cookies::CookieJar`, a
genuine Rails class pressed into service as a rack-test stand-in.

Source: `vendor/rack-test/lib/rack/test/cookie_jar.rb` (251 lines), two classes:

- `Cookie` (`:10-132`) — `name` (`:14`), `value` (`:17`), `raw` (`:21`),
  `initialize(raw, uri = nil, default_host = DEFAULT_HOST)` (`:23`),
  `replaces?` (`:49`), `empty?` (`:54`), `domain` (`:59`), `secure?` (`:65`),
  `http_only?` (`:71`), `path` (`:76`), `expires` (`:81`), `expired?` (`:86`),
  `valid?` (`:91`), `matches?` (`:101`), `<=>` (`:106`), `to_h` (`:111`),
  `default_uri` (`:125`).
- `CookieJar` (`:134-250`) — `initialize(cookies = [], default_host =
DEFAULT_HOST)` (`:137`), `initialize_copy` (`:143`), `[]` (`:150`), `[]=`
  (`:160`), `get_cookie` (`:166`), `delete` (`:174`), `merge` (`:184`), `<<`
  (`:197`), `for` (`:208`), `to_hash` (`:225`), `each_cookie_for` (`:244`).

Both are `# :nodoc:` in Ruby, so `blazetrails/rails-private-jsdoc` will want
`@internal` on them — autofixable.

Tests, **52 cases** across three files:

| Ruby                                   | TS                          | cases |
| -------------------------------------- | --------------------------- | ----- |
| `spec/rack/test/cookie_jar_spec.rb`    | `src/cookie-jar.test.ts`    | 10    |
| `spec/rack/test/cookie_spec.rb`        | `src/cookie.test.ts`        | 33    |
| `spec/rack/test/cookie_object_spec.rb` | `src/cookie-object.test.ts` | 9     |

Ruby-idiom traps live here specifically: `<=>` is a comparison operator with no
JS equivalent spelling (see `docs/ruby-ts-conventions.md` before naming it),
`[]` / `[]=` are index accessors, and `initialize_copy` is Ruby's `dup`/`clone`
hook — `cookie_jar_spec.rb:9` ("copies should not share a cookie jar") asserts
its behaviour directly.

This story does **not** touch `integration.ts`. Replacing `MockSession`'s jar is
`0104-twitter-app-full-stack-integration/converge-integration-session-to-rack-test-session`,
which owns that change.

`Cookie#expires` is `Time.parse(@options['expires'])` (`cookie_jar.rb:82`), and `#valid?` writes `uri.host = @default_host` on a `nil` host (`:93`) while `#default_uri` parses a scheme-less `'//' + host + '/'` (`:126`). Neither `Time.parse` nor `URI` exists in trails; both have stories under RFC 0129 — see `deps`.

## Acceptance criteria

- [ ] `packages/rack-test/src/cookie-jar.ts` ports both classes member for member in
      Rails source order, with the Rails names and parameter names.
- [ ] The three test files credit all 52 cases under `parity:test`; no test name is
      reworded.
- [ ] `packages/actionpack/src/action-dispatch/testing/integration.ts` is unchanged.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates green
      with no new baseline rows.
