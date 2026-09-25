---
title: "pg-point-mutation-dirty-after-reload"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-25T01:44:13Z"
assignee: "nested-through-polymorphic-accessor-fidelity"
blocked-by: null
closed-reason: null
---

## Context

`test_mutation` (geometric_test.rb:69): after `p.x.y = 25; save!; reload`, `p.isChanged` is still true where Rails asserts not changed.

Parked `it.skip` in packages/activerecord/src/adapters/postgresql/geometric.test.ts (converged body intact); Rails: vendor/rails/activerecord/test/cases/adapters/postgresql/geometric_test.rb. Root cause not yet investigated.

## Acceptance criteria

- Fix the port so the parked test(s) pass; un-skip them.
