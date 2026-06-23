---
title: "Converge BigInt PK assertions: query-cache + associations (flip prereq)"
status: in-progress
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 4026
claim: "2026-06-23T17:50:58Z"
assignee: "pg-bigserial-assertion-sweep-querycache-associations"
blocked-by: null
---

## Context

Prerequisite for `pg-bigserial-createtable-dumper-flip` (#3966, RFC 0030). The
moment the PG default-PK flips int4→int8, every default-PK column deserializes
to JS `BigInt`, so unconverged `expect(record.id).toBe(<number>)` and FK-vs-PK
comparisons break (e.g. `expected 357271355 to be 357271355n`,
`[10n] to deeply equal [10]`). CI run 28040851821 (PR #3966 PG lane) surfaced
the full set; this story converges the two heaviest files.

Failing assertion sites (verbatim line numbers from the flip CI run):

- `packages/activerecord/src/query-cache.test.ts`:
  386,394,396,420,421,636,644,645,664,668,721,723,901,903
- `packages/activerecord/src/associations.test.ts`:
  349,1482,2154,2193,2224,2254,2309,2402,2433,2449,2535

Converge each to expect `BigInt` where the value originates from a default-PK
column (Rails uses Ruby Integer uniformly; trails deserializes int8→BigInt —
the campaign's chosen convergence is to update the assertion, not the
deserializer). Verify against the corresponding Rails test that the compared
value is genuinely the PK/FK and not an unrelated int4 column.

## Acceptance criteria

- [ ] Every listed assertion in both files is green on the PG lane WITH the
      bigserial flip applied locally (cherry-pick #3966's diff to verify).
- [ ] Green on all three lanes (sqlite/mysql unaffected; numbers stay numbers).
- [ ] Test names verbatim — no renames. Do NOT touch the deserializer.
