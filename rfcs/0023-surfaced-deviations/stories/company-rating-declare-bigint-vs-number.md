---
title: "Company#rating declare says bigint but safe-range values cast to number"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
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

## Context

`packages/activerecord/src/test-helpers/models/company.ts:52` declares
`rating: bigint | null`, but `BigIntegerType` (per
`IntegerType.castValue`, packages/activemodel — bigint only past
Number.MAX_SAFE_INTEGER) returns `number` for safe-range values like the
Rails-canonical `2147483648` (base_test.rb `test_bignum`, converged in
PR #5126). The declared type lies about the runtime value, so tests
assigning/reading `rating` need `as any` casts (see `bignum` in
`packages/activerecord/src/base.test.ts`). Audit other canonical models
declaring bigint columns as `bigint` for the same mismatch.

## Acceptance criteria

- `Company.rating` (and any sibling bigint-column declares) typed to match
  the actual cast surface (`number | bigint | null` or a shared alias).
- The `bignum` test in base.test.ts drops its `as any` casts.
