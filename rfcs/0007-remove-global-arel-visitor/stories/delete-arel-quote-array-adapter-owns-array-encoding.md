---
title: "Delete arel's quote-array; the PG adapter owns array encoding"
status: in-progress
updated: 2026-07-23
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: ["delete-arel-default-quoters-and-constructor-defaults"]
deps-rfc: []
est-loc: 250
priority: 20
pr: 5189
claim: "2026-07-23T22:27:11Z"
assignee: "delete-arel-quote-array-adapter-owns-array-encoding"
blocked-by: null
closed-reason: null
---

## Context

Split out of `delete-arel-default-quoters-and-constructor-defaults` (the pair
exceeded the 500-LOC ceiling). Discovered while shipping #5032.

`packages/arel/src/quote-array.ts` (141 LOC) + `quote-array.test.ts` implement
PostgreSQL array-literal encoding inside Arel. Rails has **no** Arel-side array
encoding: the adapter owns it, and Arel does no value formatting at all
(`to_sql.rb:867-870` delegates every quoting decision to the connection). trails'
`quoteArrayLiteral` + its `formatElement` hook are an invention.

The activerecord side already has the Rails-shaped owner:
`OID::Array#encode` (`connection-adapters/postgresql/oid/array.ts`).

**Entanglements to resolve — this is why it is its own story:**

1. #5008 added `array-encode-parity.trails.test.ts`, which pins
   `quoteArrayLiteral`/`postgresqlDefaultQuoter` byte-for-byte against
   `OID::Array#encode`. It _deliberately depends on the duplication existing_, so
   it either dies with `quote-array.ts` or is repointed. Decide which, with a
   stated rationale — do not delete it silently, it is the only thing anchoring
   those bytes.
2. Two sibling stories become **moot** once the adapter's `encode_array` is the
   only array path, and should be closed as superseded rather than worked:
   - `converge-arel-array-string-elements-to-content-based-quoting` (arel quotes
     elements by _type_; the pg gem quotes by _content_)
   - `converge-arel-array-booleans-to-unquoted-true` (arel uses `quoted_*` where
     Rails uses `unquoted_*`)
3. Sequenced after `delete-arel-default-quoters-and-constructor-defaults`, since
   `quoteArrayLiteral` takes an `ArelConnection` and its last caller disappears
   with the quoter hosts.

## Acceptance criteria

- [ ] `packages/arel/src/quote-array.ts` and `quote-array.test.ts` are deleted.
- [ ] No arel-side array encoding remains; `OID::Array#encode` is the only path.
- [ ] `array-encode-parity.trails.test.ts` is repointed or removed with a rationale.
- [ ] The two superseded sibling stories are closed with `--reason`.
- [ ] api:compare / test:compare delta non-negative.
