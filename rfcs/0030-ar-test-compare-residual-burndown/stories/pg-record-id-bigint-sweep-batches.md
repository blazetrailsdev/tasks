---
title: "pg-record-id-bigint-sweep-batches"
status: ready
updated: 2026-06-18
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of the `pg-default-pk-bigserial-cascade` campaign (RFC 0030); sibling of
`pg-record-id-bigint-assertion-sweep` (kick-off PR #3597 converged
`finder.test.ts`). Once the PG default PK flips to `bigserial`, trails
deserializes int8 to a JS `BigInt`, so `record.id` becomes e.g. `1n`.
Id-arithmetic comparators of the form `.sort((a, b) => a - b)` over ids throw
`"Cannot convert a BigInt value to a number"` under BigInt.

Enumerated hit(s) in `packages/activerecord/src/batches.test.ts`:

- line 364: `[...ids].sort((a, b) => a - b)`

Validate the audit by forcing the flip locally (`serialIdType` →
`bigserial` for postgres in `test-helpers/define-schema.ts`) and running the
file under `ARCONN=postgres`.

## Acceptance criteria

- [ ] Converge each id-arithmetic / `record.id` assertion in `packages/activerecord/src/batches.test.ts` to be green
      on BOTH the serial and bigint lanes (wrap numeric compares in
      `Number(...)`, or assert the BigInt form). Test names stay verbatim.
- [ ] Green on default lane AND `ARCONN=postgres` (with and without the flip).
- [ ] Keep PR <300 LOC; single PR from main.
