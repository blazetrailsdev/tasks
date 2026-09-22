---
title: "assertions-has-many-associations-remainder-6"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7950
claim: "2026-09-22T02:26:29Z"
assignee: "assertions-has-many-associations-remainder-6"
blocked-by: null
closed-reason: null
---

## Context

Sixth slice of `assertions-has-many-associations-remainder`. The `-5` PR converged reload with
query cache / reloading unloaded with query cache (rb:927-970), build / new aliased to build
(rb:1121-1140), collection size/empty with dirty target (rb:1158-1176) and delete_all with
not-yet-loaded collection (rb:1563) in
`packages/activerecord/src/associations/has-many-associations.test.ts`
(`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`).

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Remaining clusters: build many / build followed by save / create followed by save,
counter-cache cluster, dependence for associations with hash condition (rb:1910), replace
failure, set ids on new record, extend option, in-memory replacement, create-with-bang raises
cluster, custom primary key on new record, first_or_create, has many on new records null
relations.

Known blockers: rb:2506 transaction proxy test; rb:1764 (`has-many-delete-nullify-out-of-scope`).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed
  remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
