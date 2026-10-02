---
title: "api-compare: a declare class property is extracted as a bodied member, so a declare alone scores as a port"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

Found while burning activemodel's `parity:api:moves` rows to zero (trails PR 8423).

`scripts/api-compare/extract-ts-api.ts` (the `ts.isPropertyDeclaration(member)`
arm of the class walker, near line 3932) records a `declare` class property —
`declare static modelName: ModelName` on `Model`
(`packages/activemodel/src/model.ts`), `declare errors: Errors<this>` — as an
ordinary member with no `bodyless` flag. A `declare` property emits nothing at
runtime: it is the type side of a member some `include()` / `extend()` installs,
exactly what an `interface` signature is, and the interface case IS marked
`bodyless` (RFC 0126, PR 7159).

Consequences:

- `declarationOnlyInFile` answers false for such a name, so in the EXPECTED file
  a `declare` alone scores as a port, the hole RFC 0126 closed for interfaces.
- PR 8423 could not key its include-arm fix on "the includer only declares it"
  and had to key it on "the defining file holds a body" instead, because every
  `declare static` on `Model` read as bodied.

Measured in that PR's dump of `output/ts-api.json`: `model.ts:Model`'s
`_validators`, `is_validators`, `modelName`, `i18nScope`, `lookupAncestors`,
`humanAttributeName`, `defineModelCallbacks`, `_mergeAttributes`,
`paramDelimiter`, `errors` and every `validates*Of` all carry `bodyless=undefined`.

## Acceptance criteria

- [ ] A class `PropertyDeclaration` carrying the `declare` modifier is extracted with `bodyless: true`; one with an initializer or without `declare` is unchanged.
- [ ] An `extract-ts-api.test.ts` case covers `declare static x: T` and `declare x: T` beside a plain property.
- [ ] The PR body re-reports the `DeclOnly` population per package before and after; names that newly turn declaration-only are filed against `burn-down-the-declaration-only-population`, never baselined.
- [ ] All parity gates green; a STALE call/args row this surfaces is deleted only after checking the body it should pair with.
