---
title: "Response#to_a's @headers.to_hash answers a plain object from a JS-class Rack::Headers"
status: ready
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

Repo-owner ruling (2026-10-19): response headers are a plain object or a JS
class, never a ruby-compat `Hash`. So `Rack::Headers` must not extend `Hash`
(as it has since trails#9071), and the Rack triple's headers stay a plain
object. Passing the current `Hash`-backed `toHash()` was tried in the closing
sweep and reddened 85 actiondispatch tests, because every consumer reads
`headers["location"]` / `Object.entries`.

## Acceptance criteria

- `Rack::Headers` (`packages/rack/src/headers.ts`) is a JS class, not a `Hash` subclass, per the ruling.
- `toA` spells Rails' call, `this._headers.toHash()` (`response.rb:412`), and the Rack triple's headers are a plain object. The Action Pack and Rack lanes are green.
- `actiondispatch` joins `NAMING_ENROLLED_PACKAGES` and `pnpm parity:api:calls:args` is green, which closes `enroll-actiondispatch-in-naming-gate`.
