---
title: "extractor-misses-nested-class-expressions-rack-session-cookie-base64"
status: draft
updated: 2026-11-04
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:class-paths --check` (the `Rails API/Test Comparison` job, scoped
to packages a PR touches) reports `packages/rack-session/src/constants.generated.ts`
and `scripts/api-compare/constant-residue.json` stale **on main's own
`packages/rack-session/src/cookie.ts`**: its pairing drops

- `Rack::Session::Cookie::Base64`
- `Rack::Session::Cookie::Base64::JSON`
- `Rack::Session::Cookie::Base64::ZipJSON`

(`rack-session/lib/rack/session/cookie.rb:91-139`). The TS extractor's
`ts-api.json` lists only `Cookie`, `Cookie.Identity`, `Cookie.Marshal` and
`Cookie.SessionId` for `cookie.ts`: `static Base64 = class Base64 { static
JSON = class JSON extends Base64 … }` is not extracted at its nested path (and
`Base64::Marshal` is recorded as `Cookie.Marshal`). The non-check write mode
keeps the rows, so main stays green only because no PR has touched
rack-session since. Hoisting `Base64` to a module-level class seated with
`static Base64 = Base64` hits the same gap; exporting it pairs it as
`Rack::Session::Base64` (`class-paths.ts` `tsPath` / `resolveTsClassForRuby`).
Found on trails#9729.

## Acceptance criteria

- The extractor records a class expression nested under a static class
  expression at its full path (`Cookie.Base64`, `Cookie.Base64.Marshal`,
  `Cookie.Base64.JSON`, `Cookie.Base64.ZipJSON`).
- `pnpm parity:class-paths --check` is clean for rack-session with the three
  rows kept, and `rbModName(Cookie.Base64.JSON)` is
  `"Rack::Session::Cookie::Base64::JSON"`.
