---
title: "assertions-has-many-associations-remainder-7"
status: draft
updated: 2026-09-22
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

Sixth slice of `assertions-has-many-associations-remainder`. The `-5` PR converged new aliased to build, build, collection size/empty with dirty target, delete all with not yet loaded association collection, replace failure and the single-extension extend-option test onto canonical fixtures in `packages/activerecord/src/associations/has-many-associations.test.ts`, and made `assertQueriesCount` return the block's value like Rails (`activerecord/lib/active_record/testing/query_assertions.rb:18-31`).

Counters now 42 count / 114 kind mismatches. Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Remaining: set ids for association on new record (rb, `company.contract_ids = [...]` — find the trails ids writer spelling), reload with query cache / reloading unloaded with query cache (rb:932-970), counter-cache cluster (`assert_difference`), dependence for associations with hash condition (rb:1910), in-memory replacement tests, custom primary key on new record, restrict with exception/error, destroying cluster.

Known blockers: rb:2506 transaction proxy test; rb:1764 (`has-many-delete-nullify-out-of-scope`); multi-extension tests (`has-many-extend-option-super-chain`).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
