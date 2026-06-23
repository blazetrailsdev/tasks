---
title: "pg-bigint-pk-number-fk-association-key-match"
status: done
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: 4010
claim: "2026-06-23T15:18:54Z"
assignee: "pg-bigint-pk-number-fk-association-key-match"
blocked-by: null
---

## Context

Part of the `pg-default-pk-bigserial-cascade` campaign (RFC 0030). When the PG
default PK flips to `bigserial` (story `pg-bigserial-createtable-dumper-flip`,
draft PR #3966), int8 PK columns deserialize to JS `BigInt` (`1n`), but FK
columns declared as `integer`/`references` (int4) deserialize to `number` (`1`)
because node-postgres parses int4 to `number`. Association preloading and
in-memory matching build JS Maps/Sets keyed by the owner PK and look up by the
child FK value; `1n !== 1` as Map keys, so the lookup misses and the association
comes back **empty**.

Evidence — CI run 28021658047 (PG lane, PR #3966) with the flip applied, the two
dominant failure signatures across the suite are NOT id-assertion churn:

- `expected [] to have a length of 1 but got +0` (123×)
- `expected [] to have a length of 2 but got +0` (78×)
- `expected null not to be null` (51×)
- `expected "loadRecordsInBatch" to be called 3 times, but got 2 times` (9×)

These are functional: associations/finders return empty / nil where rows exist.
The existing code-bug deps in the campaign (#3485 IN-clause BigInt; untyped-PK
int8 deserialization) do NOT cover the preloader/association key-mismatch path.

Likely sites (confirm by reading): association preloading / join-dependency
caching where owner PK and child FK are compared or used as Map/Set keys
(`packages/activerecord/src/associations/**`, preloader, join_dependency
construct). The fix must normalize the key type on both sides (e.g. compare/key
by a stable string or coerced form) so a `BigInt` PK matches a `number` FK,
mirroring Rails (Ruby Integer == regardless of width).

## Acceptance criteria

- [ ] With the bigserial flip applied locally on the PG lane, association
      preloading / in-memory matching returns the correct rows when the owner PK
      is `BigInt` and the child FK is `number` (and vice versa).
- [ ] The `[] length` / `null not to be null` / `loadRecordsInBatch` count
      failures in associations + eager-loading + through-association test files
      go green. Test names stay verbatim.
- [ ] Green on all three lanes. Keep PR(s) <300 LOC; group by subsystem, file
      additional stories rather than fanning out PRs from one agent.

## Notes

This is a prerequisite for `pg-bigserial-createtable-dumper-flip`. Distinct from
the pure `record.id` assertion sweep (tracked separately) — this is real code,
not test churn.
