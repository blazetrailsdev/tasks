---
title: "pg-circle-column-reads-object"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

`test_geometric_types`/`test_alternative_format` (geometric_test.rb:196-230): a circle column reads back as an object ('[object Object]') instead of the string '<(5.3,10.4),2>'.

Parked `it.skip` in packages/activerecord/src/adapters/postgresql/geometric.test.ts (converged body intact); Rails: vendor/rails/activerecord/test/cases/adapters/postgresql/geometric_test.rb. Root cause not yet investigated.

## Acceptance criteria

- Fix the port so the parked test(s) pass; un-skip them.
