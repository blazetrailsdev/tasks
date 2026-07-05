---
title: "Normalize BigInt in BelongsToAssociation#staleState composite-FK JSON.stringify"
status: claimed
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 3
pr: null
claim: "2026-07-05T16:22:29Z"
assignee: "pg-bigint-belongs-to-stalestate-composite-key-serialize"
blocked-by: null
---

## Context

Surfaced while fixing the BigInt cascade for the PG bigserial flip (#3966).
That PR point-fixed `CollectionAssociation#recordIdentity`
(`collection-association.ts:843`) to fold BigInt PK values to decimal string
before `JSON.stringify` (node-postgres deserializes int8 → JS `BigInt`, which
`JSON.stringify` rejects: "Do not know how to serialize a BigInt"). The
preloader path (`preloader/association.ts:_convertKey`) is also already
BigInt-hardened.

`BelongsToAssociation#staleState` (`belongs-to-association.ts:210`) is NOT:

```ts
return values.length === 1 ? values[0] : JSON.stringify(values);
```

The composite-FK branch does a raw `JSON.stringify(values)` with no
normalization, so a `belongs_to` with a composite FK that includes a BigInt
component (int8 column under bigserial) throws the same serialize error on the
stale-state check. The single-FK branch returns `values[0]` unstringified, so
it's safe. This is a latent bug — current composite-key belongs_to tests use
integer FKs, so CI stayed green.

Normalize BigInt components before `JSON.stringify` here, mirroring the
`recordIdentity` fix (fold `bigint` → `.toString()`). Audit the other
`JSON.stringify` PK/FK-value sites flagged during the flip work to confirm
they're either value-normalized or operate on column _names_ (e.g.
`has-one-association.ts:394` stringifies `foreignKeyColumns()` — names, safe).

## Acceptance criteria

- [ ] `BelongsToAssociation#staleState` composite-FK path normalizes BigInt
      components before `JSON.stringify` (no "Do not know how to serialize a
      BigInt"); deterministic key preserved.
- [ ] A test exercises a composite-FK belongs_to with a BigInt FK component on
      the PG lane. Test names verbatim where mirroring Rails.
