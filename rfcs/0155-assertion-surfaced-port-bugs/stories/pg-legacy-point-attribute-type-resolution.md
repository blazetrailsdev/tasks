---
title: "pg-legacy-point-attribute-type-resolution"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8075
claim: "2026-09-25T01:44:13Z"
assignee: "nested-through-polymorphic-accessor-fidelity"
blocked-by: null
closed-reason: null
---

## Context

`test_legacy_roundtrip`/`test_legacy_mutation` (geometric_test.rb:126-146): `attribute :legacy_x, :legacy_point` reads back a PointValue {x,y} instead of [x, y].

Parked `it.skip` in packages/activerecord/src/adapters/postgresql/geometric.test.ts (converged body intact); Rails: vendor/rails/activerecord/test/cases/adapters/postgresql/geometric_test.rb. Root cause not yet investigated.

## Acceptance criteria

- Fix the port so the parked test(s) pass; un-skip them.
