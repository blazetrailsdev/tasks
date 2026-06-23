---
title: "Converge BigInt PK assertions: belongs-to-associations (flip prereq)"
status: ready
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Blocker for `pg-bigserial-createtable-dumper-flip` (#3966, RFC 0030); see the
impl sibling story for root cause (int8 PK → BigInt vs integer FK → number
under the flip). Pure assertion-churn convergence for `belongs_to`
(`expected N to be Nn`). Coerce the PK-originating side (e.g. `Number()` /
`.map(Number)`, mirroring the merged sweep PRs #4025/#4029) and verify each is
genuinely a PK/FK comparison against the Rails test.

- `associations/belongs-to-associations.test.ts`:
  324,500,521,642,743,847,914,954,998,1019,1059,1186,1338,2309,2361,2381,2406,2452,2544,2581,2712,2731,2802,2903,3006,3024,3065,3276,3350,3399

## Acceptance criteria

- [ ] Every listed assertion green on PG WITH the flip applied locally; green
      on sqlite/mysql. Test names verbatim. Do NOT touch the deserializer.
