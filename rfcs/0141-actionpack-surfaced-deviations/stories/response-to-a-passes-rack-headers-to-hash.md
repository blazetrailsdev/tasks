---
title: "Response#to_a passes @headers.to_hash, so the Rack triple carries Rack::Headers"
status: draft
updated: 2026-10-19
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

Rails' `Response#to_a`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:410-413`)
is `commit!` then `rack_response @status, @headers.to_hash`. `@headers` is a
`Rack::Headers`, a `Hash` subclass, so `to_hash` answers the headers object
itself and the Rack triple carries it.

trails' `toA` (`packages/actionpack/src/action-dispatch/http/response.ts:509-512`)
passes `this._headers.toH()`, a plain-object copy. Since trails#9071 made
`Rack::Headers` inherit the Hash surface, this is the last actiondispatch
`naming` row in `pnpm parity:api:calls:args`
(`toA rack_response (toHash)`). It is convergeable, so no `@missingRailsName`
receipt is legal, and it is what keeps `actiondispatch` out of
`NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts`).

Swapping in `toHash()` was tried in the closing sweep for
`actionpack-parity-closing-sweep` and reddened 85 actiondispatch tests. Every
Rack-triple consumer reads the headers as a plain object (`headers["location"]`,
`Object.entries`), for example `routing/redirection.test.ts:105` and
`testing/integration.test.ts`. Converging means the Rack triple's headers
answer `[]` reads as a `Rack::Headers` does (or every consumer reads through
`Hash#[]`).

## Acceptance criteria

- `toA` passes `this._headers.toHash()` to `rackResponse`, as `response.rb:412` does.
- Rack-triple header consumers in actionpack and rack read the `Rack::Headers` they are given; the Action Pack lane is green.
- `actiondispatch` joins `NAMING_ENROLLED_PACKAGES` and `pnpm parity:api:calls:args` is green (this closes `enroll-actiondispatch-in-naming-gate`).
