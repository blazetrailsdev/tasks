---
title: "rack-request-forwarded-scheme"
status: draft
updated: 2026-08-30
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 48
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Request#scheme` in `packages/rack/src/request.ts:211-217` reads
`rack.url_scheme` and nothing else. Rack 3's `Rack::Request::Helpers#scheme`
(`vendor/rack/lib/rack/request.rb`) consults the forwarded headers first —
`forwarded_scheme`, which reads `Forwarded: proto=`, then
`HTTP_X_FORWARDED_SCHEME` / `HTTP_X_FORWARDED_PROTO` (taking the first value of
a comma-separated list), gated by `trusted_proxy?` — before falling back to
`rack.url_scheme`.

Surfaced while porting `Rack::Handler::Node` (PR #7244, RFC 0104). The old
private bridge in `trailties/src/server/vite-plugin.ts` sniffed
`X-Forwarded-Proto` inside the handler to compute `rack.url_scheme`. Rails'
`Rackup::Handler::WEBrick#service`
(`rackup-2.2.1/lib/rackup/handler/webrick.rb:100`) does no such thing — it only
checks `env["HTTPS"]`, which `webrick/https.rb:67-70` sets — so that widening
was invented behavior in the wrong layer and was dropped rather than carried
into the ported handler. Rack puts the logic in `Request#scheme`, and our
`Request` does not have it yet, so a trails app behind a TLS-terminating proxy
currently reports `http`.

`Rack::Request#ssl` (`request.ts:219-221`) and the `HTTP_X_FORWARDED_*`
constants (`constants.ts:6-10`) already exist, so the constants are in place.

## Acceptance criteria

- `Request#scheme` mirrors Rack 3's arm order: `forwarded_scheme` first, then
  `rack.url_scheme`.
- `forwarded_scheme` is ported with Rails' name, reading `Forwarded: proto=`
  then `x-forwarded-scheme` then `x-forwarded-proto`, first value of a list.
- `trusted_proxy?` gating matches Rails, or its absence is cited if the
  supporting surface is not ported yet.
- Tests carry the Rails test names from `vendor/rack/test/spec_request.rb`.
