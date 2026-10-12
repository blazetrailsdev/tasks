---
title: "globalid: URI::GID defines hash and eql? as URI::Generic does"
status: draft
updated: 2026-10-12
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8823, which ported `GlobalID#hash` as Rails writes it:
`self.class.hash | @uri.hash` (`vendor/globalid/v1.3.0/lib/global_id/global_id.rb:72-74`).

`@uri` is a `URI::GID`, a `URI::Generic`, which defines all three members in
`vendor/ruby/v3.3.11/lib/uri/generic.rb`:

- `==` (`:1396-1402`): same class, and `normalize.component_ary` equal.
- `hash` (`:1404-1406`): `self.component_ary.hash`.
- `eql?` (`:1408-1412`): same class, same `parser`, and `component_ary.eql?(oth.component_ary)`.

trails' `GID` (`packages/globalid/src/uri/gid.ts:168`) has only `equals` (`:196-204`), tagged
`@noRailsEquivalent PERMANENT`, comparing app (case-insensitively), model name, model id and params.
It has no `hash` and no `eql`. So:

- `rbHash(gid)` takes `rbHash`'s fallback arm for an object with `equals`
  (`packages/ruby-compat/src/rb-hash.ts`, `stringHash("GID(" + String(value) + ")")`), a hash of the
  whole URI string rather than of the component array.
- `rbEql` / `uniq` / a ruby-compat `Hash` keyed by a `GID` have no `eql` to dispatch to.

`GlobalID#hash` in `packages/globalid/src/global-id.ts` calls `rbHash(this.uri)` and inherits that
fallback.

## Converged shape

- `GID#hash()` answers `rbHash` of the component array, in `URI::Generic#component_ary`'s order
  (`generic.rb:1414-1428`).
- `GID#eql(oth)` is `URI::Generic#eql?`: same class and component arrays `eql?`. Unlike `==` it does
  not normalize, so two GIDs differing only in the case of the app are `==` and not `eql?`.
- `equals` is checked against `URI::Generic#==` plus whatever `URI::GID` overrides, and its
  `@noRailsEquivalent PERMANENT` tag is dropped if the body is that method.

## Acceptance criteria

- [ ] `GID` defines `hash()` and `eql()` with the bodies above, each citing `generic.rb`.
- [ ] Two GIDs with the same components hash alike; a `GID` and a `GlobalID` over it hash apart, as
      `global_id_test.rb:244-248` asserts.
- [ ] `global-id.test.ts` and `uri/gid` tests pass; `pnpm parity:api:extra:gate` stays green.
