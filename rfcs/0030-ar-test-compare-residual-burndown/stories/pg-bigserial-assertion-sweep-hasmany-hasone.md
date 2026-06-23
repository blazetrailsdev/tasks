---
title: "Converge BigInt PK assertions: has-many/has-one/through + small assoc files (flip prereq)"
status: ready
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Blocker for `pg-bigserial-createtable-dumper-flip` (#3966, RFC 0030); see the
impl sibling story for root cause. Pure assertion-churn convergence for
`has_many` / `has_one` / `has_one :through` and small association files
(`expected N to be Nn`). Coerce the PK-originating side per the merged sweeps
(#4025/#4029); verify each against the Rails test.

- `associations/has-many-associations.test.ts`:
  654,679,696,930,1647,2059,2096,2114,2134,2463,2507,3521,3692,5694,5771,5791,5836,5876,5916,6007,6351,6369,6391,6854,7359,7384,7727
- `associations/has-one-associations.test.ts`: 185,568,583
- `associations/has-one-through-associations.test.ts`: 262,279,390,1071,1458,1471,1656
- `associations/join-model.test.ts`: 312,325
- `associations/inverse-associations.test.ts`: 692,701
- `associations/preloader-bigint-number-key-match.test.ts`: 50,69
- `associations/collection-proxy.test.ts`: 456
- `associations/disable-joins-association-scope.test.ts`: 205,232
- `associations/disable-joins-composite-key.test.ts`: 279
- `associations/disable-joins-nested-through.test.ts`: 206

## Acceptance criteria

- [ ] Every listed assertion green on PG WITH the flip applied locally; green
      on sqlite/mysql. Test names verbatim. Do NOT touch the deserializer.
