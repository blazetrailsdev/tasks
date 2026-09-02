---
title: "Type forwarded_for's elements as Ruby's String | nil instead of asserting non-null"
status: done
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 20
pr: 7393
claim: "2026-09-02T16:33:35Z"
assignee: "converge-forwarded-for-nil-element-type"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Request::Helpers#forwarded_for` (`vendor/rack/lib/rack/request.rb:353-371`)
maps `split_authority(authority)[1]` over both its `:forwarded` and
`:x_forwarded` arms and — unlike its neighbour `forwarded_port` (`:374-391`) —
does **not** `.compact`. So an authority that misses the `AUTHORITY` regex
(`:722-735`) leaves a `nil` in the returned array, and Ruby's element type is
`String | nil`.

trails (`packages/rack/src/request.ts`, `get forwardedFor()`) writes both arms
with a non-null assertion — `this.splitAuthority(authority)[1]!` — while
declaring `string[] | null`. The runtime value is right (the `undefined` stays
in the array, as Ruby's `nil` does), but the declared type is a lie, and it is
the type every consumer reads.

`ip` (`:414-433`) is the consumer that makes it observable: it calls
`reject_trusted_ip_addresses(forwarded_for).last || forwarded_for.first`, so a
nil element flows into `trusted_proxy?` and can be returned as the client
address.

Found while converging `split_authority` onto Ruby's empty miss shape in #7348.
That PR fixed the two callers that silently dropped the miss (`forwarded_port`'s
filter, `host_with_port`'s strict compare); this one keeps the miss, as Ruby
does, but mistypes it.

## Acceptance criteria

- `forwardedFor` answers `Array<string | undefined> | null`, or whatever
  spelling carries Ruby's `String | nil` element, with the `!` assertions gone.
- `ip` and `rejectTrustedIpAddresses` are checked against `:414-433` and
  `:743-745` for what they do with a nil element, and match.
- A test covering a forwarded authority that misses `AUTHORITY` — Rack's
  `spec_request.rb` has no such case, so it belongs in
  `packages/rack/src/request.trails.test.ts` alongside the existing
  miss-shape coverage.
- `parity:api` rack non-negative; `parity:api:calls` / `:args` gain no rows.
