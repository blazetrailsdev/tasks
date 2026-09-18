---
title: "assertions-postgresql-array-and-adapter-remainder"
status: draft
updated: 2026-09-18
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of assertions-postgresql-geometric-array-and-adapter after geometric_test.rb was converged. Still divergent (measure with `pnpm parity:test -- --package activerecord --assertions --missing`): adapters/postgresql/postgresql_adapter_test.rb (16 count / 29 kind) and adapters/postgresql/array_test.rb (9 / 26).

## Acceptance criteria

- Both files report 0 assertion-count/kind/value mismatches; failures parked per RFC 0132 rules.
