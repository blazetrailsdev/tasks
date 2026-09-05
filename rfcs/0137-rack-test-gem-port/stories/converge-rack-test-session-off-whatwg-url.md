---
title: "converge-rack-test-session-off-whatwg-url"
status: done
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7515
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-rack-test-cookie-jar` (#7499) converged `Cookie` / `CookieJar` off the
WHATWG `URL` onto the ported `URI::Generic`
(`packages/ruby-compat/src/uri/generic.ts`), because `cookie_jar.rb` is written
against a URI that can be host-less and scheme-less — `#valid?` writes
`uri.host = @default_host` on a nil host
(`vendor/rack-test/lib/rack/test/cookie_jar.rb:94`) and `#default_uri` parses a
scheme-less `'//' + host + '/'` (`:126`). `URL` cannot represent either.

`Rack::Test::Session` was NOT converged in that PR — `packages/rack-test/src/test.ts`
still builds a WHATWG `URL` in `parseUri` and threads it through `envFor` and
`processRequest`. Ruby's `Session#parse_uri` (`vendor/rack-test/lib/rack/test.rb:271-277`)
is `URI.parse`, and `#env_for` (`:297`) branches on `URI::HTTPS === uri`, so the
`URL` is a trails invention at every one of those sites.

To bridge the two, #7499 added three adapter calls in `test.ts` that Rails does
not have:

- `setCookie` (`test.rb:145`): `this.cookieJar.merge(cookie, uri && URI.parse(uri.toString()))`
- `processRequest` (`test.rb:353`): `this.cookieJar.for(URI.parse(uri.toString()))`
- `processRequest` (`test.rb:364`): `this.cookieJar.merge(..., URI.parse(uri.toString()))`

Each re-parses a URI that `parseUri` should have produced as a `Generic` in the
first place. They are debt, not design.

`port-rack-test-session` owns `test.ts` and already deps on
`port-uri-for-parse-merge-and-scheme-classes`, but its body predates these three
call sites, so this story exists to make sure they are deleted rather than
carried forward.

## Acceptance criteria

- [ ] `Session#parseUri` returns `Generic` (`URI.parse`, `test.rb:271-277`), and
      `envFor` / `processRequest` thread that value rather than a WHATWG `URL`.
- [ ] All three `URI.parse(uri.toString())` adapter calls in `test.ts` are gone;
      the cookie-jar calls pass the `Generic` they already hold.
- [ ] `envFor`'s scheme branch is `URI::HTTPS === uri` (`test.rb:297`), not a
      `uri.protocol === "https:"` string test.
- [ ] `parity:api` / `parity:test` deltas non-negative; both call gates green
      with no new baseline rows.
- [ ] Coordinate with `port-rack-test-session` — if that story lands first and
      already removes the three adapters, close this one as done by it.
