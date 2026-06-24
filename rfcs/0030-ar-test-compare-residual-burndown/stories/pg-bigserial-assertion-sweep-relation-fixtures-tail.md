---
title: "Converge BigInt PK assertions: relation/fixtures/adapter tail (flip prereq)"
status: in-progress
updated: 2026-06-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: 4042
claim: "2026-06-24T00:00:43Z"
assignee: "pg-bigserial-assertion-sweep-relation-fixtures-tail"
blocked-by: null
---

## Context

Blocker for `pg-bigserial-createtable-dumper-flip` (#3966, RFC 0030); see the
impl sibling story for root cause. Pure assertion-churn convergence for the
relation / fixtures / adapter long tail (`expected N to be Nn`). Coerce the
PK-originating side per the merged sweeps (#4025/#4029); verify against Rails.

- `relation/field-ordered-values.test.ts`: 33,76,96,148
- `relation/select.test.ts`: 246
- `relation/where.test.ts`: 1055
- `test-helpers/use-fixtures.test.ts`: 253,314,355,380,400,551
- `adapters/postgresql/foreign-table.test.ts`: 122

## Acceptance criteria

- [ ] Every listed assertion green on PG WITH the flip applied locally; green
      on sqlite/mysql. Test names verbatim. Do NOT touch the deserializer.
