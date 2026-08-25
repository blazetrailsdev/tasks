---
title: "Sweep PG-lane record.id assertions to tolerate BigInt (pre-BIGSERIAL-flip)"
status: done
updated: 2026-06-18
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: 3597
claim: "2026-06-18T18:30:38Z"
assignee: "pg-record-id-bigint-assertion-sweep"
blocked-by: null
---

## Context

Part of the `pg-default-pk-bigserial-cascade` campaign (RFC 0030). Once the PG
default PK becomes `bigserial`, trails deserializes int8 to JS `BigInt`
(`activemodel/src/type/big-integer.ts`), so `record.id` becomes e.g. `1n` across
the PG suite. Many Rails-mirrored AR tests assert `expect(record.id).toBe(1)`
(number) or do arithmetic on ids (e.g. `.sort((a, b) => a - b)`, which throws
`"Cannot convert a BigInt value to a number"` on BigInt).

These assertions must be converged to tolerate/expect BigInt so they are green
BOTH on the current serial lane AND after the createTable flip (e.g. wrap with
`Number(record.id)` where a numeric compare is intended, or assert the BigInt
form). This is the "sweep" criterion of the parent story — likely several PRs
grouped by test file, each <300 LOC.

Concrete known hits (non-exhaustive; do a full PG-lane sweep with the createTable
flip applied locally to enumerate):

- `finder.test.ts` `find on hash conditions with array of integers and ranges`
  — `results.map(p => p.id).sort((a, b) => a - b)` throws on BigInt.

## Acceptance criteria

- [ ] Audit the PG lane WITH the createTable flip applied locally and enumerate
      every `record.id` assertion / id-arithmetic that breaks under BigInt.
- [ ] Converge each to be green on both serial and bigint lanes. Group by test
      file; keep each PR <300 LOC. Test names stay verbatim.
- [ ] Land all sweep PRs BEFORE the createTable flip story.

## Notes

This is a tracking/kick-off story; expect it to spawn per-file sibling stories as
the audit enumerates the blast radius. Do NOT fan out PRs from one agent — file
new stories per file group.
