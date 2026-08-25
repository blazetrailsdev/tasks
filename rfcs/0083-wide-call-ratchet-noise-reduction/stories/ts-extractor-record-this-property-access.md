---
title: "Record this.<prop> accesses as calls for zero-arg members"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 200
pr: 4656
claim: "2026-07-31T18:05:17Z"
assignee: "ts-extractor-record-this-property-access"
blocked-by: null
closed-reason: null
---

## Context

`extractCalls` (`extract-ts-api.ts:2247-2290`) records call expressions and
`new` expressions only. It never records a property access. Rails methods that
trails ports as a TS getter or field — `owner`, `reflection`, `scope`, `klass`,
`loaded?` — are read as `this.owner`, so the wide gate sees the Rails call
`owner` as missing from every body that uses it.

`significantMissingCalls` gate 2 was supposed to catch this: it skips calls
whose TS candidate is a zero-arg reader (`compare.ts:272`). But
`isPortedWithArgs` is built from the package+deps-wide `tsParamsByName`
(`compare.ts:1657-1659`), so one same-named method taking a parameter anywhere
defeats it.

Measured: 257 rows (post receiver-scoping and transitive-closure) are this
class. Examples: `associations/association.ts` `find_target` flagged for
`owner`, `reflection`, `scope`, `klass`; `collection-association.ts`
`concat_records` flagged for `loaded?`.

## Acceptance criteria

- `extractCalls` records `this.<prop>` (and `super.<prop>`) property accesses as
  call names, gated on `<prop>` resolving to a zero-arg member — method, getter,
  or property — of the same class/interface.
- The gate is required: an ungated blanket record would let any property
  reference silence a dropped call.
- Bare identifier / non-`this` property accesses are NOT recorded — the receiver
  is unknown and crediting them reintroduces the collision this story fixes.
- `extract-ts-api.test.ts` covers: getter access recorded; method-with-args
  property access NOT recorded; non-`this` receiver NOT recorded.
- Baseline reseeded; expected delta ≈ −257 wide rows.
