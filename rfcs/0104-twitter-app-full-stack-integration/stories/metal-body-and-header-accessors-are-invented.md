---
title: "Metal#body / #setHeader / #getHeader are invented surface; Rails has response_body and headers"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Metal` has no `body`, `body=`, `get_header` or `set_header`.
Its whole response-writing surface is `response_body` / `response_body=`
(`vendor/rails/actionpack/lib/action_controller/metal.rb:238-246`) plus four
delegations to `@_response` (`metal.rb:179-208`): `headers`, `status` /
`status=`, `content_type` / `content_type=`, `location` / `location=`,
`media_type`.

trails' `Metal` carries four extra public members
(`packages/actionpack/src/action-controller/metal.ts`):

- `set body(value)` / `get body()` — since #7376 these just forward to
  `responseBody`, so they are a pure alias Rails does not define;
- `setHeader(name, value)` / `getHeader(name)` — Rails writes
  `headers[name] = value` against the delegated `Rack::Headers`, which trails
  now also exposes as `Metal#headers`, so these two are redundant with it.

They are load-bearing today: `setHeader` / `getHeader` have call sites across
`base.ts`, `head`, `data-streaming.ts` and most of the controller tests, and
`body` is read by nearly every render assertion. That is why #7376 delegated
them rather than deleting them.

`location` / `location=` is the other half of the same gap — `head`
(`metal/head.rb:40`) is `self.location = url_for(location)`, and trails spells
it `this.setHeader("location", ...)`.

## Converged shape

- Delete `Metal#body` / `body=`; call sites use `responseBody` /
  `responseBody=` (`metal.rb:238-246`).
- Delete `Metal#setHeader` / `getHeader`; call sites go through
  `Metal#headers`, the delegation at `metal.rb:179-180`, using the
  `Rack::Headers` accessors.
- Add `Metal#location` / `location=` delegating to the Response
  (`metal.rb:187-188`, `metal.rb:199-200`) and use it in `head`.

## Acceptance criteria

- `pnpm parity:api:extra --package actioncontroller` no longer lists `body`,
  `body=`, `setHeader` or `getHeader` on `metal.ts`.
- `head` assigns `self.location` rather than writing the header by name
  (`metal/head.rb:40`).
- No `@noRailsEquivalent` receipt is added in place of a deletion.
