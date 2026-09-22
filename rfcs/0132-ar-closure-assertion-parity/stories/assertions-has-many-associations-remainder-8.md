---
title: "assertions-has-many-associations-remainder-8"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7959
claim: "2026-09-22T15:04:38Z"
assignee: "assertions-has-many-associations-remainder-8"
blocked-by: null
closed-reason: null
---

## Context

Seventh slice of `assertions-has-many-associations-remainder`. The `-7` PR converged the destroying cluster (rb:1802-1855) and five `assert_difference` counter-cache tests (rb:1438,1447,1480,1616,1624) in `packages/activerecord/src/associations/has-many-associations.test.ts`.

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Remaining: set ids for association on new record, reload with query cache (rb:932-970), rest of counter-cache cluster (deleting with dependent delete all/destroy, has many without counter cache option, overlapping counter cache columns, deleting by integer id), dependence with hash condition (rb:1910), in-memory replacement, custom primary key on new record, create-with-bang raises, destroy (all) on association clears scope, find ids.

Known blockers: rb:2506 transaction proxy; rb:1764 (`has-many-delete-nullify-out-of-scope`); multi-extension (`collection-proxy-extend-super-chain`).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
