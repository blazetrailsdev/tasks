---
title: "Converge Integration#cookies onto the mock session's cookie_jar"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6674
claim: "2026-08-17T22:43:01Z"
assignee: "converge-collection-association-size-counted-arms"
blocked-by: null
closed-reason: null
---

# Converge Integration#cookies onto the mock session's cookie_jar

## Context

`ActionDispatch::Integration::Session#cookies`
(actionpack/lib/action_dispatch/testing/integration.rb:114-116) is one line:

```ruby
def cookies
  _mock_session.cookie_jar
end
```

`_mock_session` is the Rack::Test session the integration session drives, and
the jar it hands back is the single cookie store the whole session shares.
trails has no `_mock_session`
(packages/actionpack/src/action-dispatch/testing/integration.ts): `get cookies`
either builds a jar with `CookieJar.build(undefined, this._persistentCookies)`
when no request has run yet, or reads one back through
`testProcessCookies(...)` — two stores stitched together where Rails has one.

Surfaced by RFC 0106 wave 3, which recorded the gap as a per-row justification on
`cookies | cookie_jar` in
`call-mismatches-exclude/actiondispatch/testing/integration.json`.

## Converged shape

Give the integration session the Rack::Test-shaped mock session that owns the
jar (Rails' `_mock_session`), and reduce `cookies` to reading `cookieJar` off
it. Then delete the row by hand via `serializeBaseline` and lower the mark with
`pnpm parity:api:calls:tighten actiondispatch/testing/integration.json`.

## Acceptance criteria

- [ ] One cookie store per integration session, read through the mock session.
- [ ] The `cookies | cookie_jar` row is deleted; gate green, no `--write`.
