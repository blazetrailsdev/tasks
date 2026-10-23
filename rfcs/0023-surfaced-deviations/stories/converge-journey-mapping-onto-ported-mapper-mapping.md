---
title: "Journey::Routes#add_route types its mapping against the ported Mapper::Mapping, not a local interface"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
packages:
  - "actionpack"
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Refinement (2026-10-22)

Re-verified against trails `origin/main` when 0023 was retired. Mapper::Mapping now ported (mapper.ts:448); only journey/routes.ts:6-9's local interface + receipt remain; est-loc 20. Where this note and the original text below disagree, the note is current; the acceptance criteria apply to what remains.

## Context

`packages/actionpack/src/action-dispatch/journey/routes.ts:11` declares a local
`interface Mapping { makeRoute(name, index) }` as a stand-in for
`ActionDispatch::Routing::Mapper::Mapping`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:83`), which
trails has not ported — `packages/actionpack/src/action-dispatch/routing/mapper.ts`
declares no `Mapping` class. Rails' `Journey::Routes#add_route` receives a real
`Mapper::Mapping` instance (`journey/routes.rb`), so the interface is deferred
porting work, not a coincidental name collision.

Found by the RFC 0080 audit of `moved` interface declaration names
(`audit-moved-interface-declaration-names`), which tagged it
`@noRailsEquivalent CONVERGEABLE (story: <this story>)`.

## Acceptance criteria

- `ActionDispatch::Routing::Mapper::Mapping` is ported into
  `action-dispatch/routing/mapper.ts` in Rails layout.
- `journey/routes.ts` types `addRoute` on the ported class and the local
  `Mapping` interface plus its `@noRailsEquivalent` tag are deleted.
- `pnpm parity:api:extra` exits 0 (no stale tag).
