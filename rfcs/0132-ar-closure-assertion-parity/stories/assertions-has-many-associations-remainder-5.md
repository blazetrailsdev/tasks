---
title: "assertions-has-many-associations-remainder-5"
status: in-progress
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7949
claim: "2026-09-22T02:00:56Z"
assignee: "assertions-has-many-associations-remainder-5"
blocked-by: null
closed-reason: null
---

## Context

Fifth slice of `assertions-has-many-associations-remainder`. The `-4` PR converged the
finder cluster (find each with conditions, find in batches, find all/first sanitized,
find first after reset scope / reload, find grouped, find scoped grouped) onto canonical
companies fixtures in `packages/activerecord/src/associations/has-many-associations.test.ts`
(`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:844-992`).

Counters now 52 count / 122 kind mismatches.

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Remaining clusters: reload with query cache / reloading unloaded with query cache (rb:932-970),
build/new aliased, collection size/empty with dirty target, counter-cache cluster,
`delete_all` with not-yet-loaded collection, dependence for associations with hash
condition (rb:1910), replace failure, set ids on new record, extend option, in-memory
replacement, composite key, custom primary key on new record.

Known blockers: rb:2506 transaction proxy test; rb:1764 (`has-many-delete-nullify-out-of-scope`).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed
  remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
