---
title: "Converge association/through/inverse key-match for BigInt PK vs number FK (flip blocker)"
status: in-progress
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 18
pr: 4033
claim: "2026-06-23T19:53:05Z"
assignee: "pg-bigint-assoc-key-match-through-inverse-impl"
blocked-by: null
---

## Context

Blocker for `pg-bigserial-createtable-dumper-flip` (#3966, RFC 0030),
enumerated by the flip CI PG lane (run 28050673795). The bigserial flip makes
default-PK columns int8 → JS `BigInt`, while FK columns stay `integer` →
`number` (Rails-faithful: schema.rb declares these `t.integer`; in Ruby both
are Integer so `assert_equal` passes, but trails strict equality does not).

This story owns the files where the mismatch causes **functional impl
failures** (not just assertion display): association resolution / inverse
setting / through-join / disable-joins paths compare a `BigInt` PK to a
`number` FK with `===` and miss, leaving targets `undefined` (→ TypeError /
`expected undefined to be …`). This is the residual of
`pg-bigint-pk-number-fk-association-key-match` (#4010), which did not cover
these paths. The `recordIdentity` JSON.stringify(BigInt) case is already
fixed on the flip branch (collection-association.ts) — use it as the pattern.

Fix the shared key-matching code (compare PK/FK by value across number/BigInt,
e.g. normalize both to string or `==`-equivalent), then converge any residual
`expected N to be Nn` assertions **in these same files** (whole-file ownership
to avoid overlap with the sweep stories):

- `associations/has-many-through-disable-joins-associations.test.ts`:
  impl 344,355,384,430,464,602,610,620,472; churn 629,640
- `associations/has-many-through-associations.test.ts`:
  impl 1756,1965,3242,7012,7020,7036; churn 1422,1511,2947,2995,3025,3074,3104,3135,3189
- `associations/nested-through-associations.test.ts`: 403,2841
- `associations/eager.test.ts`: impl 5642,5869; churn 4749,5487,5498,5509,5521,5533,5603,5631,5870,6054
- `associations/association-relation.test.ts`: impl 78,107; churn 88
- `associations/sti-owner-through-foreign-key.test.ts`: impl 59; churn 45
- `associations.test.ts`: 349 (inverse target not set under BigInt PK)
- `scoping/default-scoping.test.ts`: impl 934,950; churn 900,903
- `scoping/relation-scoping.test.ts`: impl 118; churn 564,566
- `relation/delegation.test.ts`: 366,406

## Acceptance criteria

- [ ] Association/inverse/through/disable-joins key-matching treats BigInt PK
      and number FK as equal; the impl sites above resolve (no undefined
      target / TypeError) WITH the flip applied locally on PG.
- [ ] Residual assertions in these files green on PG; green on sqlite/mysql.
- [ ] Test names verbatim. Fix the matching code, not the schema (FK columns
      stay `integer` per Rails). Coordinate with #3966 (carries recordIdentity).
